/* --- Engine: Selection, History, Keyboard, Integrations ------------------
   Single source of truth for undo/redo + selection. History snapshots are
   taken exactly once at the end of meaningful user actions:
     - pointerup after a drag
     - pointerup after a resize
     - tree reorder
     - import-html insert
     - delete / clear
   Other inputs (text edits, inspector sliders) trigger save via their own
   `change` listeners.
--------------------------------------------------------------------------- */

const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");

function snapshotHTML() {
  // Light clone of the shadow inner root for cheap diffs.
  const clone = shadowRootInner.cloneNode(true);
  clone.querySelectorAll(".canvas-element").forEach(el => el.classList.remove("is-selected","is-dragging"));
  return clone.innerHTML;
}

function saveHistoryState() {
  const state = snapshotHTML();
  if (historyIndex >= 0 && historyStack[historyIndex] === state) return;
  if (historyIndex < historyStack.length - 1) historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(state);
  historyIndex++;
  updateHistoryButtons();
}
function updateHistoryButtons() {
  if (undoBtn) undoBtn.disabled = historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1;
}
function loadHistoryState(i) {
  if (i < 0 || i >= historyStack.length) return;
  deselectElement();
  shadowRootInner.innerHTML = historyStack[i];
  Array.from(shadowRootInner.children).forEach(c => recursivelyMakeDraggable(c));
  if (placeholder) placeholder.style.display = shadowRootInner.children.length ? "none" : "flex";
  renderDOMTree();
  updateHistoryButtons();
}

if (undoBtn) undoBtn.addEventListener("click", () => { if (historyIndex > 0) loadHistoryState(--historyIndex); });
if (redoBtn) redoBtn.addEventListener("click", () => { if (historyIndex < historyStack.length - 1) loadHistoryState(++historyIndex); });

document.addEventListener("keydown", e => {
  if (document.activeElement && ["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey && historyIndex < historyStack.length - 1) loadHistoryState(++historyIndex);
    else if (!e.shiftKey && historyIndex > 0) loadHistoryState(--historyIndex);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
    e.preventDefault();
    if (historyIndex < historyStack.length - 1) loadHistoryState(++historyIndex);
  }
  if ((e.key === "Backspace" || e.key === "Delete") && selectedElement && !selectedElement.isContentEditable) {
    selectedElement.remove(); deselectElement(); saveHistoryState();
  }
});

/* --- Selection ----------------------------------------------------------- */
function selectElement(el) {
  if (selectedElement) selectedElement.classList.remove("is-selected");
  selectedElement = el;
  selectedElement.classList.add("is-selected");
  const emptyState = document.getElementById("inspector-empty-state");
  if (emptyState) emptyState.classList.add("hidden");
  const tagEl = document.getElementById("insp-tag-name");
  if (tagEl) tagEl.innerText = el.tagName.toLowerCase();
  if (typeof updateInspector === "function") updateInspector(el);
  if (typeof resizeShow === "function") resizeShow(el);
  if (typeof renderDOMTree === "function") renderDOMTree();
}
function deselectElement() {
  if (selectedElement) {
    selectedElement.classList.remove("is-selected");
    selectedElement = null;
    const emptyState = document.getElementById("inspector-empty-state");
    if (emptyState) emptyState.classList.remove("hidden");
    if (typeof resizeHide === "function") resizeHide();
    if (typeof renderDOMTree === "function") renderDOMTree();
  }
}

window.selectElement = selectElement;
window.deselectElement = deselectElement;
window.saveHistoryState = saveHistoryState;

/* --- Click selection + double-click edit -------------------------------- */
shadowRootInner.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest(".canvas-element");
  if (el) selectElement(el); else deselectElement();
});

shadowRootInner.addEventListener("dblclick", e => {
  const el = e.target.closest && e.target.closest(".canvas-element");
  if (!el) return;
  if (["IMG","HR","SVG","INPUT","TEXTAREA"].includes(el.tagName)) return;
  el.contentEditable = "true";
  el.focus();
  if (!["DIV","UL","OL","TABLE","TBODY","TR","NAV","SECTION","FORM","FOOTER","ASIDE"].includes(el.tagName)) {
    document.execCommand("selectAll", false, null);
  }
  el.addEventListener("blur", function onBlur() {
    el.contentEditable = "false";
    el.removeAttribute("contenteditable");
    if (selectedElement === el) {
      if (typeof updateInspector === "function") updateInspector(el);
      if (typeof resizeShow === "function") resizeShow(el);
    }
    el.removeEventListener("blur", onBlur);
    saveHistoryState();
  });
});

/* --- Delete + Clear ------------------------------------------------------ */
const deleteBtn = document.getElementById("delete-el-btn");
if (deleteBtn) deleteBtn.addEventListener("click", () => {
  if (selectedElement) { selectedElement.remove(); deselectElement(); saveHistoryState(); }
});

const clearBtn = document.getElementById("clear-canvas-btn");
if (clearBtn) clearBtn.addEventListener("click", () => {
  if (!confirm("Clear canvas?")) return;
  shadowRootInner.innerHTML = "";
  if (placeholder) placeholder.style.display = "flex";
  deselectElement();
  saveHistoryState();
});

/* --- Initial history capture -------------------------------------------- */
setTimeout(saveHistoryState, 200);
