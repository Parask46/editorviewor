/* --- 8-Way Bounding Box Resizing ------------------------------------------
   Renders N/S/E/W/NE/NW/SE/SW handles around the selected element inside
   #resize-layer (an absolute container at the top of the canvas). Pointer
   math divides the delta by currentScale so the cursor never outpaces the
   edge under zoom. Text elements scale their font-size by diagonal ratio.
--------------------------------------------------------------------------- */

const RESIZE_HANDLES = ["n","s","e","w","ne","nw","se","sw"];
const CURSORS = {
  n:"ns-resize", s:"ns-resize", e:"ew-resize", w:"ew-resize",
  ne:"nesw-resize", sw:"nesw-resize", nw:"nwse-resize", se:"nwse-resize"
};

let active = null;

function buildLayer() {
  if (resizeLayer.children.length) return;
  RESIZE_HANDLES.forEach(dir => {
    const h = document.createElement("div");
    h.className = `resize-handle resize-${dir}`;
    h.dataset.dir = dir;
    h.style.cssText = `
      position:absolute; width:10px; height:10px; background:#E2FD70;
      border:2px solid #0A0A0A; border-radius:2px; z-index:60;
      box-shadow:0 2px 4px rgba(0,0,0,.4);
    `;
    h.addEventListener("pointerdown", onHandleDown);
    resizeLayer.appendChild(h);
  });
  // Outline
  const outline = document.createElement("div");
  outline.id = "resize-outline";
  outline.style.cssText = `
    position:absolute; border:2px solid #E2FD70; pointer-events:none;
    border-radius:2px; box-sizing:border-box;
  `;
  resizeLayer.insertBefore(outline, resizeLayer.firstChild);
}

function resizeHide() {
  resizeLayer.style.display = "none";
}
function resizeShow(el) {
  if (!el) { resizeLayer.style.display = "none"; return; }
  resizeLayer.style.display = "block";
  const r = el.getBoundingClientRect();
  const host = resizeLayer.getBoundingClientRect();
  const left = (r.left - host.left) / currentScale;
  const top  = (r.top  - host.top)  / currentScale;
  const w = r.width / currentScale;
  const h = r.height / currentScale;
  const outline = resizeLayer.querySelector("#resize-outline");
  if (outline) {
    outline.style.left = `${left}px`;
    outline.style.top  = `${top}px`;
    outline.style.width  = `${w}px`;
    outline.style.height = `${h}px`;
  }
  resizeLayer.querySelectorAll(".resize-handle").forEach(h => {
    const d = h.dataset.dir;
    let hx = left, hy = top;
    if (d.includes("e")) hx = left + w;
    if (d.includes("w")) hx = left;
    if (d.includes("s")) hy = top + h;
    if (d.includes("n")) hy = top;
    if (d === "n" || d === "s") { hx = left + w / 2 - 5; }
    if (d === "e" || d === "w") { hy = top + h / 2 - 5; }
    h.style.left = `${hx - (d.includes("w") ? 0 : 0) - (d.includes("w") ? 0 : 0)}px`;
    h.style.top  = `${hy}px`;
    if (d === "e") { h.style.left = `${left + w - 5}px`; h.style.top = `${top + h/2 - 5}px`; }
    if (d === "w") { h.style.left = `${left - 5}px`; h.style.top = `${top + h/2 - 5}px`; }
    if (d === "n") { h.style.left = `${left + w/2 - 5}px`; h.style.top = `${top - 5}px`; }
    if (d === "s") { h.style.left = `${left + w/2 - 5}px`; h.style.top = `${top + h - 5}px`; }
    if (d === "ne"){ h.style.left = `${left + w - 5}px`; h.style.top = `${top - 5}px`; }
    if (d === "nw"){ h.style.left = `${left - 5}px`; h.style.top = `${top - 5}px`; }
    if (d === "se"){ h.style.left = `${left + w - 5}px`; h.style.top = `${top + h - 5}px`; }
    if (d === "sw"){ h.style.left = `${left - 5}px`; h.style.top = `${top + h - 5}px`; }
    h.style.cursor = CURSORS[d];
  });
}

function onHandleDown(e) {
  if (!selectedElement) return;
  e.preventDefault(); e.stopPropagation();
  const dir = e.currentTarget.dataset.dir;
  const r = selectedElement.getBoundingClientRect();
  active = {
    el: selectedElement,
    dir,
    startX: e.clientX, startY: e.clientY,
    baseLeft: selectedElement.offsetLeft,
    baseTop:  selectedElement.offsetTop,
    baseW:    selectedElement.offsetWidth,
    baseH:    selectedElement.offsetHeight,
    fontPx:   parseFloat(window.getComputedStyle(selectedElement).fontSize) || 16,
    pointerId: e.pointerId
  };
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
}

function onMove(e) {
  if (!active || e.pointerId !== active.pointerId) return;
  e.preventDefault();
  const dx = (e.clientX - active.startX) / currentScale;
  const dy = (e.clientY - active.startY) / currentScale;
  let { baseLeft, baseTop, baseW, baseH } = active;
  let newLeft = baseLeft, newTop = baseTop, newW = baseW, newH = baseH;
  const d = active.dir;

  if (d.includes("e")) newW = Math.max(20, baseW + dx);
  if (d.includes("s")) newH = Math.max(20, baseH + dy);
  if (d.includes("w")) { newW = Math.max(20, baseW - dx); newLeft = baseLeft + (baseW - newW); }
  if (d.includes("n")) { newH = Math.max(20, baseH - dy); newTop  = baseTop  + (baseH - newH); }

  active.el.style.left   = `${newLeft}px`;
  active.el.style.top    = `${newTop}px`;
  active.el.style.width  = `${newW}px`;
  active.el.style.height = `${newH}px`;
  active.el.style.minWidth = "0px";
  active.el.style.minHeight = "0px";
  active.el.style.overflow = "hidden";
  active.el.style.wordBreak = "break-word";

  // Text elements scale font-size by diagonal ratio.
  const tag = active.el.tagName.toLowerCase();
  const isText = ["h1","h2","h3","h4","h5","h6","p","span","a","button"].includes(tag);
  if (isText) {
    const startDiag = Math.hypot(baseW, baseH);
    if (startDiag > 0) {
      const newDiag = Math.hypot(newW, newH);
      active.el.style.fontSize = `${Math.max(4, active.fontPx * (newDiag / startDiag))}px`;
    }
  }

  resizeShow(active.el);
  if (typeof updateInspector === "function") updateInspector(active.el);
}

function onUp(e) {
  if (!active || e.pointerId !== active.pointerId) return;
  active = null;
  if (typeof renderDOMTree === "function") renderDOMTree();
  if (typeof saveHistoryState === "function") saveHistoryState();
}

buildLayer();
window.addEventListener("pointermove", onMove);
window.addEventListener("pointerup", onUp);
window.addEventListener("pointercancel", onUp);
