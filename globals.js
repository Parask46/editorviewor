// Global State & Shadow DOM Setup
const dropZone = document.getElementById("drop-zone");
const placeholder = document.getElementById("canvas-placeholder");
const resizeLayer = document.getElementById("resize-layer");

let currentScale = 1;
let selectedElement = null;

// History State
let historyStack = [];
let historyIndex = -1;

/* --- Shadow DOM Encapsulation ---------------------------------------------
   The drop-zone hosts an open ShadowRoot. All canvas content lives inside
   `.canvas-root` so editor Tailwind utilities don't bleed into user markup
   and vice-versa. The 8-way resize layer and placeholder live on the host
   so they can layer above content with their own z-index.
--------------------------------------------------------------------------- */
const SHADOW_CSS = `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }
  .canvas-root {
    position: relative;
    width: 100%; height: 100%;
    color: #111827;
    font-family: 'General Sans', system-ui, sans-serif;
  }
  .canvas-root h1 { font-size: 2.25rem; font-weight: 700; margin: 0 0 .5em; line-height: 1.2; }
  .canvas-root h2 { font-size: 1.875rem; font-weight: 700; margin: 0 0 .5em; line-height: 1.3; }
  .canvas-root h3 { font-size: 1.5rem; font-weight: 600; margin: 0 0 .5em; }
  .canvas-root p  { margin: 0 0 1rem; line-height: 1.6; }
  .canvas-root a  { color: #2563eb; text-decoration: underline; cursor: pointer; }
  .canvas-root ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 1rem; }
  .canvas-root ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 1rem; }
  .canvas-root svg { overflow: visible; display: block; }
  .canvas-root svg path,
  .canvas-root svg rect,
  .canvas-root svg circle,
  .canvas-root svg ellipse,
  .canvas-root svg polygon { vector-effect: non-scaling-stroke; }

  /* Dragged elements use transform for 60fps movement; final position
     is committed to style.left / style.top on pointerup. */
  .canvas-element { position: absolute; cursor: grab; user-select: none; -webkit-user-select: none; }
  .canvas-element.is-dragging { opacity: 0.4; cursor: grabbing; }
  .canvas-element[contenteditable="true"] { outline: 2px solid #E2FD70 !important; cursor: text; background: rgba(226, 253, 112, 0.05); }
  .canvas-element.is-selected { outline: 2px solid #E2FD70 !important; outline-offset: -1px; }
`;

const shadowHost = document.createElement("div");
shadowHost.id = "canvas-shadow-host";
shadowHost.style.cssText = "position:absolute; inset:0; pointer-events:auto;";
dropZone.appendChild(shadowHost);

const shadowRoot = shadowHost.attachShadow({ mode: "open" });
const shadowStyle = document.createElement("style");
shadowStyle.textContent = SHADOW_CSS;
shadowRoot.appendChild(shadowStyle);

const shadowRootInner = document.createElement("div");
shadowRootInner.className = "canvas-root";
shadowRoot.appendChild(shadowRootInner);

// Back-compat: existing code calls dropZone.appendChild / .children / .querySelector.
// Delegate those to the shadow root so we don't have to refactor every caller.
const _append = Node.prototype.appendChild;
dropZone.appendChild = function (node) { return shadowRootInner.appendChild(node); };
dropZone.insertBefore = function (node, ref) { return shadowRootInner.insertBefore(node, ref); };
dropZone.removeChild = function (node) { return shadowRootInner.removeChild(node); };
dropZone.querySelector = function (sel) { return shadowRootInner.querySelector(sel); };
dropZone.querySelectorAll = function (sel) { return shadowRootInner.querySelectorAll(sel); };
dropZone.contains = function (node) { return shadowRootInner.contains(node); };
Object.defineProperty(dropZone, "children", {
  configurable: true,
  get() { return shadowRootInner.children; }
});
Object.defineProperty(dropZone, "firstElementChild", {
  configurable: true,
  get() { return shadowRootInner.firstElementChild; }
});
Object.defineProperty(dropZone, "lastElementChild", {
  configurable: true,
  get() { return shadowRootInner.lastElementChild; }
});
Object.defineProperty(dropZone, "innerHTML", {
  configurable: true,
  get() { return shadowRootInner.innerHTML; },
  set(v) { shadowRootInner.innerHTML = v; }
});

// Helpers
function rgbToHexStr(col) {
    if (!col || col === "transparent" || col === "none") return "";
    if (col.startsWith("#")) {
        if (col.length === 4) return "#" + col[1]+col[1]+col[2]+col[2]+col[3]+col[3];
        return col.substring(0,7);
    }
    if (col.startsWith("rgb")) {
        try {
            const a = col.split("(")[1].split(")")[0].split(",");
            const b = a.map(x => {
                let hex = parseInt(x.trim()).toString(16);
                return (hex.length === 1) ? "0"+hex : hex;
            });
            return "#" + b.slice(0,3).join("");
        } catch(e) { return ""; }
    }
    return "";
}

function recursivelyMakeDraggable(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
  if (el.tagName.toLowerCase() === "svg") return;
  el.classList.add("canvas-element");
  el.dataset.tag = el.tagName.toLowerCase();
  Array.from(el.children).forEach(child => {
    if (!["BR","HR","STYLE","SCRIPT"].includes(child.tagName)) recursivelyMakeDraggable(child);
  });
}

/* --- Tier classification used by z-index router + AABB nudger ----------- */
const TEXT_LIKE = new Set(["h1","h2","h3","h4","h5","h6","p","span","a","label","li","strong","em","b","i","small"]);
const STRUCTURAL = new Set(["div","section","article","aside","header","footer","nav","main","form","fieldset","table"]);
const CONTAINER_TAGS = new Set(["button","a","form","div","section","article","aside","header","footer","nav","main","fieldset","label"]);
const ROOT_BLOCK_TAGS = new Set(["div","section","article","aside","header","footer","nav","main","form","figure"]);

function isTextLike(el) { return el && TEXT_LIKE.has(el.tagName.toLowerCase()); }
function isStructural(el) {
  if (!el) return false;
  const t = el.tagName;
  return STRUCTURAL.has(t.toLowerCase()) || t === "IMG" || t === "SVG";
}
function isValidContainer(el) {
  if (!el || !el.classList || !el.classList.contains("canvas-element")) return false;
  return CONTAINER_TAGS.has(el.tagName.toLowerCase());
}

/* --- Smart Z-Index Routing ----------------------------------------------- */
function maxZIndex() {
  let m = 0;
  Array.from(shadowRootInner.children).forEach(c => {
    if (!c.classList || !c.classList.contains("canvas-element")) return;
    m = Math.max(m, parseInt(c.style.zIndex) || 0);
  });
  return m;
}
function minTextZIndex() {
  let m = Infinity;
  Array.from(shadowRootInner.children).forEach(c => {
    if (!c.classList || !c.classList.contains("canvas-element")) return;
    if (!isTextLike(c)) return;
    const z = parseInt(c.style.zIndex) || 0;
    if (z < m) m = z;
  });
  return m === Infinity ? 10 : m;
}
function assignSmartZIndex(el) {
  let z;
  if (isTextLike(el))              z = Math.max(maxZIndex() + 1, 10);
  else if (isStructural(el))       z = Math.max(minTextZIndex() - 1, 1);
  else                              z = Math.max(Math.floor(maxZIndex() / 2) + 5, 5);
  el.style.zIndex = String(z);
}

/* --- AABB collision detection -------------------------------------------- */
function getAABB(el) {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
}
function rectsOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}
function rectFullyContains(outer, inner) {
  return outer.left <= inner.left && outer.top <= inner.top &&
         outer.right >= inner.right && outer.bottom >= inner.bottom;
}
const NUDGE_STEP = 16;
const NUDGE_RADIUS = 24;
function findNonOverlappingPosition(el, x, y) {
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  const myAABB = getAABB(el);
  let collided = false;
  Array.from(shadowRootInner.children).forEach(other => {
    if (other === el || !other.classList || !other.classList.contains("canvas-element")) return;
    const o = getAABB(other);
    if (rectsOverlap(myAABB, o) && (rectFullyContains(myAABB, o) || rectFullyContains(o, myAABB))) collided = true;
  });
  if (!collided) return { x, y, nudged: false };

  let best = null;
  for (let ring = 1; ring <= NUDGE_RADIUS; ring++) {
    for (let dx = -ring * NUDGE_STEP; dx <= ring * NUDGE_STEP; dx += NUDGE_STEP) {
      for (let dy = -ring * NUDGE_STEP; dy <= ring * NUDGE_STEP; dy += NUDGE_STEP) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring * NUDGE_STEP) continue;
        el.style.left = `${x + dx}px`; el.style.top = `${y + dy}px`;
        const tryAABB = getAABB(el);
        let clear = true;
        Array.from(shadowRootInner.children).forEach(other => {
          if (other === el || !other.classList || !other.classList.contains("canvas-element")) return;
          if (rectsOverlap(tryAABB, getAABB(other))) clear = false;
        });
        if (clear) {
          const dist = Math.hypot(dx, dy);
          if (!best || dist < best.dist) best = { x: x + dx, y: y + dy, dist };
        }
      }
      if (best) break;
    }
    if (best) break;
  }
  if (best) { el.style.left = `${best.x}px`; el.style.top = `${best.y}px`; return { ...best, nudged: true }; }
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  return { x, y, nudged: false };
}

/* --- Coordinate helpers --------------------------------------------------- */
function clientToCanvas(clientX, clientY) {
  const r = shadowRootInner.getBoundingClientRect();
  return { x: (clientX - r.left) / currentScale, y: (clientY - r.top) / currentScale };
}
function clientToContainer(container, clientX, clientY) {
  const r = container.getBoundingClientRect();
  return { x: (clientX - r.left) / currentScale, y: (clientY - r.top) / currentScale };
}

/* --- Smart Parent-Child Nesting ------------------------------------------ */
function findContainerAtPoint(clientX, clientY) {
  const pe = document.elementFromPoint(clientX, clientY);
  if (!pe || !pe.closest) return null;
  const host = pe.closest(".canvas-element");
  if (!host || host === dropZone || !isValidContainer(host)) return null;
  return host;
}
function nestIntoContainer(child, container, clientX, clientY) {
  if (window.getComputedStyle(container).position === "static") container.style.position = "relative";
  const { x: localX, y: localY } = clientToContainer(container, clientX, clientY);
  const cTag = container.tagName.toLowerCase();
  let payload = child;
  if ((cTag === "button" || cTag === "a") && (ROOT_BLOCK_TAGS.has(child.tagName.toLowerCase()) || child.tagName === "IMG")) {
    const wrap = document.createElement("span");
    wrap.style.display = "inline-block";
    wrap.appendChild(child);
    payload = wrap;
  }
  container.appendChild(payload);
  payload.style.position = "absolute";
  payload.style.left = `${Math.max(0, localX)}px`;
  payload.style.top  = `${Math.max(0, localY)}px`;
  payload.style.margin = "0";
  recursivelyMakeDraggable(payload);
  return payload;
}
