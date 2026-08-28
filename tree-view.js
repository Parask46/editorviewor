/* --- Advanced Interactive DOM Tree ---------------------------------------
   Renders a collapsible folder-style view of shadowRootInner inside
   #dom-tree-container. Click an item to select it on the canvas. Up/down
   controls reorder siblings (committing to the undo/redo stack). Each
   branch is collapsed/expanded via a chevron button.
--------------------------------------------------------------------------- */

const treeContainer = document.getElementById("dom-tree-container");
const collapsedSet = new Set(); // tagName:index paths that are collapsed

function pathOf(el) {
  const parts = [];
  let cur = el;
  while (cur && cur !== shadowRootInner) {
    const parent = cur.parentNode;
    if (!parent) break;
    const idx = Array.prototype.indexOf.call(parent.children, cur);
    parts.unshift(`${cur.tagName.toLowerCase()}:${idx}`);
    cur = parent;
  }
  return parts.join("/");
}

function tagIcon(tag) {
  if (tag === "img") return "image";
  if (["svg","path"].includes(tag)) return "hexagon";
  if (["h1","h2","p","span"].includes(tag)) return "type";
  if (["button","a"].includes(tag)) return "mouse-pointer-2";
  if (["input","form"].includes(tag)) return "file-text";
  return "layout";
}

function buildNode(el, depth) {
  if (!el || !el.classList || !el.classList.contains("canvas-element")) return null;
  const wrap = document.createElement("div");
  wrap.className = "tree-node";

  const row = document.createElement("div");
  row.className = "tree-item";
  if (el === selectedElement) row.classList.add("tree-selected");
  row.style.paddingLeft = `${depth * 14 + 4}px`;

  const tag = el.tagName.toLowerCase();
  const path = pathOf(el);
  const hasChildren = Array.from(el.children).some(c => c.classList && c.classList.contains("canvas-element"));

  const chev = document.createElement("button");
  chev.className = "tree-chevron";
  chev.style.cssText = "background:none;border:none;color:#737373;cursor:pointer;padding:0;width:14px;display:inline-flex;align-items:center;justify-content:center;";
  chev.innerHTML = `<i data-lucide="${collapsedSet.has(path) ? "chevron-right" : "chevron-down"}" class="w-3 h-3"></i>`;
  if (!hasChildren) chev.style.visibility = "hidden";
  chev.addEventListener("click", e => {
    e.stopPropagation();
    if (collapsedSet.has(path)) collapsedSet.delete(path);
    else collapsedSet.add(path);
    renderDOMTree();
  });
  row.appendChild(chev);

  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", tagIcon(tag));
  icon.className = "w-3.5 h-3.5";
  row.appendChild(icon);

  const tagSpan = document.createElement("span");
  tagSpan.className = "tree-item-tag";
  tagSpan.textContent = tag;
  row.appendChild(tagSpan);

  // Up/Down controls
  const controls = document.createElement("span");
  controls.className = "tree-controls";
  controls.style.cssText = "margin-left:auto;display:inline-flex;gap:2px;";
  const mkBtn = (iconName, handler) => {
    const b = document.createElement("button");
    b.style.cssText = "background:none;border:none;color:#737373;cursor:pointer;padding:2px;display:inline-flex;";
    b.innerHTML = `<i data-lucide="${iconName}" class="w-3 h-3"></i>`;
    b.addEventListener("click", e => { e.stopPropagation(); handler(); });
    return b;
  };
  controls.appendChild(mkBtn("arrow-up", () => moveSibling(el, -1)));
  controls.appendChild(mkBtn("arrow-down", () => moveSibling(el, 1)));
  controls.appendChild(mkBtn("trash-2", () => { el.remove(); if (selectedElement === el) deselectElement(); renderDOMTree(); saveHistoryState(); }));
  row.appendChild(controls);

  row.addEventListener("click", e => { e.stopPropagation(); selectElement(el); });
  wrap.appendChild(row);

  if (hasChildren && !collapsedSet.has(path)) {
    Array.from(el.children).forEach(child => {
      const sub = buildNode(child, depth + 1);
      if (sub) wrap.appendChild(sub);
    });
  }

  return wrap;
}

function moveSibling(el, dir) {
  const parent = el.parentNode;
  if (!parent) return;
  const siblings = Array.from(parent.children).filter(c => c !== resizeLayer && c !== placeholder);
  const idx = siblings.indexOf(el);
  const swap = siblings[idx + dir];
  if (!swap) return;
  if (dir < 0) parent.insertBefore(el, swap);
  else parent.insertBefore(swap, el);
  renderDOMTree();
  saveHistoryState();
}

function renderDOMTree() {
  treeContainer.innerHTML = "";
  const rootElements = Array.from(shadowRootInner.children).filter(c => c.classList && c.classList.contains("canvas-element"));
  if (!rootElements.length) {
    treeContainer.innerHTML = '<div class="text-xs text-studio-muted italic text-center mt-8">Canvas is empty</div>';
    return;
  }
  rootElements.forEach(el => {
    const node = buildNode(el, 0);
    if (node) {
      node.style.marginLeft = "0";
      node.style.borderLeft = "none";
      node.style.paddingLeft = "0";
      treeContainer.appendChild(node);
    }
  });
  if (typeof lucide !== "undefined") lucide.createIcons();
}

window.renderDOMTree = renderDOMTree;
