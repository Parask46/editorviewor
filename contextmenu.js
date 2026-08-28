/* --- Custom Right-Click Context Menu ------------------------------------- */
const contextMenu = document.getElementById("custom-context-menu");

document.addEventListener("click", () => contextMenu.classList.add("hidden"));

shadowRootInner.addEventListener("contextmenu", e => {
  e.preventDefault();
  const el = e.target.closest && e.target.closest(".canvas-element");
  if (el) selectElement(el); else deselectElement();
  let x = e.clientX, y = e.clientY;
  if (x + 200 > window.innerWidth) x -= 200;
  if (y + 250 > window.innerHeight) y -= 250;
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top  = `${y}px`;
  contextMenu.classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();
});

document.getElementById("ctx-undo").addEventListener("click", () => {
  if (typeof historyIndex !== "undefined" && historyIndex > 0) {
    const undo = document.getElementById("undo-btn");
    if (undo && !undo.disabled) undo.click();
  }
  contextMenu.classList.add("hidden");
});
document.getElementById("ctx-redo").addEventListener("click", () => {
  if (typeof historyIndex !== "undefined" && historyIndex < historyStack.length - 1) {
    const redo = document.getElementById("redo-btn");
    if (redo && !redo.disabled) redo.click();
  }
  contextMenu.classList.add("hidden");
});
document.getElementById("ctx-copy").addEventListener("click", () => {
  if (!selectedElement) return;
  const clone = selectedElement.cloneNode(true);
  const left = parseFloat(clone.style.left || 0);
  const top  = parseFloat(clone.style.top || 0);
  clone.style.left = `${left + 20}px`;
  clone.style.top  = `${top + 20}px`;
  shadowRootInner.appendChild(clone);
  recursivelyMakeDraggable(clone);
  selectElement(clone);
  saveHistoryState();
  contextMenu.classList.add("hidden");
});
document.getElementById("ctx-inspector").addEventListener("click", () => {
  const rs = document.getElementById("right-sidebar-wrapper");
  if (rs && rs.classList.contains("collapsed")) document.getElementById("properties-toggle-tab").click();
  contextMenu.classList.add("hidden");
});
document.getElementById("ctx-save").addEventListener("click", () => {
  if (typeof exportStandalone === "function") exportStandalone();
  contextMenu.classList.add("hidden");
});
document.getElementById("ctx-delete").addEventListener("click", () => {
  if (selectedElement) { selectedElement.remove(); deselectElement(); saveHistoryState(); }
  contextMenu.classList.add("hidden");
});
