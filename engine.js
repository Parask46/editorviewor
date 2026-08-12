/* --- Undo / Redo Engine --- */
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");

function saveHistoryState() {
  const clone = dropZone.cloneNode(true);
  if (clone.querySelector("#canvas-placeholder")) clone.querySelector("#canvas-placeholder").remove();
  if (clone.querySelector("#resize-handle")) clone.querySelector("#resize-handle").remove();
  clone.querySelectorAll(".canvas-element").forEach(el => el.classList.remove("is-selected", "is-dragging"));

  const stateHTML = clone.innerHTML;
  if (historyIndex >= 0 && historyStack[historyIndex] === stateHTML) return;
  if (historyIndex < historyStack.length - 1) historyStack = historyStack.slice(0, historyIndex + 1);

  historyStack.push(stateHTML);
  historyIndex++;
  updateHistoryButtons();
}

function updateHistoryButtons() {
  if(undoBtn) undoBtn.disabled = historyIndex <= 0;
  if(redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1;
}

function loadHistoryState(index) {
  if (index < 0 || index >= historyStack.length) return;
  deselectElement(); 
  
  dropZone.innerHTML = historyStack[index];
  if (placeholder) dropZone.appendChild(placeholder);
  if (resizeHandle) dropZone.appendChild(resizeHandle);

  Array.from(dropZone.children).forEach(child => {
    if (child.id !== "canvas-placeholder" && child.id !== "resize-handle") recursivelyMakeDraggable(child);
  });
  
  if (placeholder) placeholder.style.display = Array.from(dropZone.children).length > 2 ? "none" : "flex";
  if (typeof renderDOMTree === "function") renderDOMTree(); 
  updateHistoryButtons();
}

if (undoBtn) undoBtn.addEventListener("click", () => { if (historyIndex > 0) loadHistoryState(--historyIndex); });
if (redoBtn) redoBtn.addEventListener("click", () => { if (historyIndex < historyStack.length - 1) loadHistoryState(++historyIndex); });

document.addEventListener("keydown", e => {
  if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey && historyIndex < historyStack.length - 1) loadHistoryState(++historyIndex);
    else if (!e.shiftKey && historyIndex > 0) loadHistoryState(--historyIndex);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    if (historyIndex < historyStack.length - 1) loadHistoryState(++historyIndex);
  }
});

/* --- Selection Engine --- */
function selectElement(el) {
  if (selectedElement) selectedElement.classList.remove("is-selected");
  selectedElement = el;
  selectedElement.classList.add("is-selected");
  
  const emptyState = document.getElementById("inspector-empty-state");
  if (emptyState) emptyState.classList.add("hidden");
  
  const inspTagName = document.getElementById("insp-tag-name");
  if (inspTagName) inspTagName.innerText = el.tagName.toLowerCase();
  
  if (typeof updateInspector === "function") updateInspector(el);
  updateResizeHandle(); 
  if (typeof renderDOMTree === "function") renderDOMTree();
}

function deselectElement() {
  if (selectedElement) {
    selectedElement.classList.remove("is-selected");
    selectedElement = null;
    
    const emptyState = document.getElementById("inspector-empty-state");
    if (emptyState) emptyState.classList.remove("hidden");
    
    updateResizeHandle(); 
    if (typeof renderDOMTree === "function") renderDOMTree();
  }
}

/* --- Drag & Drop Math --- */
let dragOffsetX = 0; let dragOffsetY = 0;

dropZone.addEventListener("click", e => {
  if (e.target.isContentEditable || e.target.id === "resize-handle") return;
  const el = e.target.closest(".canvas-element");
  if (el) selectElement(el); else deselectElement();
});

dropZone.addEventListener("dragstart", e => {
  const el = e.target.closest(".canvas-element");
  if (!el || el.isContentEditable) { e.preventDefault(); return; }
  e.stopPropagation(); draggedCanvasElement = el;
  e.dataTransfer.setData("text/plain", "existing"); e.dataTransfer.effectAllowed = "move";

  const rect = el.getBoundingClientRect();
  dragOffsetX = (e.clientX - rect.left) / currentScale;
  dragOffsetY = (e.clientY - rect.top) / currentScale;
  if (resizeHandle) resizeHandle.style.display = "none"; 
  setTimeout(() => el.classList.add("is-dragging"), 0);
});

dropZone.addEventListener("dragend", e => {
  const el = e.target.closest(".canvas-element");
  if (el) el.classList.remove("is-dragging");
  draggedCanvasElement = null;
});

dropZone.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; });

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  if (placeholder) placeholder.style.display = "none";
  let elToInsert = draggedCanvasElement;

  if (e.dataTransfer.getData("source") === "library") {
    const temp = document.createElement("div");
    temp.innerHTML = e.dataTransfer.getData("text/plain").trim();
    elToInsert = temp.firstElementChild;
    if (elToInsert) recursivelyMakeDraggable(elToInsert);
    dragOffsetX = 20; dragOffsetY = 20; 
  }

  if (!elToInsert) return;

  const dropRect = dropZone.getBoundingClientRect();
  elToInsert.style.left = `${(e.clientX - dropRect.left) / currentScale - dragOffsetX}px`;
  elToInsert.style.top = `${(e.clientY - dropRect.top) / currentScale - dragOffsetY}px`;
  elToInsert.style.margin = "0"; 

  dropZone.appendChild(elToInsert);
  recursivelyMakeDraggable(elToInsert);
  selectElement(elToInsert);
  saveHistoryState();
});

/* --- Resizing Engine (With Padding Protection & Font Ratio) --- */
let isResizing = false; 
let resizeStartX = 0; 
let resizeStartY = 0;
let startWidth = 0; 
let startHeight = 0; 
let startFontSize = 16;
let minResizeWidth = 20;
let minResizeHeight = 20;

function updateResizeHandle() {
  if (!resizeHandle) return;
  if (!selectedElement || selectedElement === dropZone) return resizeHandle.style.display = "none";
  resizeHandle.style.display = "block";
  resizeHandle.style.left = `${selectedElement.offsetLeft + selectedElement.offsetWidth - 6}px`;
  resizeHandle.style.top = `${selectedElement.offsetTop + selectedElement.offsetHeight - 6}px`;
}

if (resizeHandle) {
    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault(); e.stopPropagation(); 
      if (!selectedElement) return;

      isResizing = true; 
      resizeHandle.classList.add("active");
      
      resizeStartX = e.clientX; 
      resizeStartY = e.clientY;
      startWidth = selectedElement.offsetWidth; 
      startHeight = selectedElement.offsetHeight;
      
      const computedStyle = window.getComputedStyle(selectedElement);
      startFontSize = parseFloat(computedStyle.fontSize) || 16;

      const padX = (parseFloat(computedStyle.paddingLeft) || 0) + (parseFloat(computedStyle.paddingRight) || 0) + (parseFloat(computedStyle.borderLeftWidth) || 0) + (parseFloat(computedStyle.borderRightWidth) || 0);
      const padY = (parseFloat(computedStyle.paddingTop) || 0) + (parseFloat(computedStyle.paddingBottom) || 0) + (parseFloat(computedStyle.borderTopWidth) || 0) + (parseFloat(computedStyle.borderBottomWidth) || 0);
      
      minResizeWidth = Math.max(20, padX + 10);
      minResizeHeight = Math.max(20, padY + 10);
    });
}

window.addEventListener("mousemove", (e) => {
  if (!isResizing || !selectedElement) return;

  const dx = (e.clientX - resizeStartX) / currentScale;
  const dy = (e.clientY - resizeStartY) / currentScale;

  const newWidth = Math.max(minResizeWidth, startWidth + dx);
  const newHeight = Math.max(minResizeHeight, startHeight + dy);

  selectedElement.style.width = `${newWidth}px`;
  selectedElement.style.height = `${newHeight}px`;

  // STOP TEXT BREAKING: Override minimums and hide overflow
  selectedElement.style.minWidth = "0px";
  selectedElement.style.minHeight = "0px";
  selectedElement.style.overflow = "hidden";
  selectedElement.style.wordBreak = "break-word";

  const inspW = document.getElementById("insp-w");
  const inspH = document.getElementById("insp-h");
  if (inspW) inspW.value = `${Math.round(newWidth)}px`;
  if (inspH) inspH.value = `${Math.round(newHeight)}px`;

  const tag = selectedElement.tagName.toLowerCase();
  const isTextOrSimpleElement = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "button", "input", "textarea"].includes(tag) || 
                                (tag === "div" && selectedElement.children.length === 0);

  if (isTextOrSimpleElement) {
      const startDiag = Math.sqrt(startWidth * startWidth + startHeight * startHeight);
      
      if (startDiag > 0) {
          const newDiag = Math.sqrt(newWidth * newWidth + newHeight * newHeight);
          const scaleRatio = newDiag / startDiag;
          const newFontSize = Math.max(4, startFontSize * scaleRatio);
          
          selectedElement.style.fontSize = `${newFontSize}px`;
          
          const inspFz = document.getElementById("insp-fz");
          if (inspFz) inspFz.value = `${Math.round(newFontSize)}px`;
      }
  }

  if (typeof updateInspector === "function") updateInspector(selectedElement); 
  updateResizeHandle();
});

window.addEventListener("mouseup", () => {
  if (isResizing) { 
      isResizing = false; 
      if (resizeHandle) resizeHandle.classList.remove("active"); 
      if (typeof renderDOMTree === "function") renderDOMTree(); 
      saveHistoryState(); 
  }
});

/* --- Text Editing Engine --- */
dropZone.addEventListener("dblclick", e => {
  const el = e.target.closest(".canvas-element");
  if (el && !["IMG", "HR", "SVG", "INPUT", "TEXTAREA"].includes(el.tagName)) {
    el.contentEditable = "true";
    el.removeAttribute("draggable");
    el.focus();

    if (!["DIV", "UL", "OL", "TABLE", "TBODY", "TR", "NAV", "SECTION", "FORM", "FOOTER", "ASIDE"].includes(el.tagName)) {
      document.execCommand("selectAll", false, null);
    }

    el.addEventListener("blur", function onBlur() {
      el.contentEditable = "false";
      recursivelyMakeDraggable(el);
      if (selectedElement === el) {
          if (typeof updateInspector === "function") updateInspector(el);
          updateResizeHandle();
      }
      if (typeof renderDOMTree === "function") renderDOMTree();
      el.removeEventListener("blur", onBlur);
      saveHistoryState();
    });
  }
});

/* --- Deletion & Clearing --- */
const deleteBtn = document.getElementById("delete-el-btn");
if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (selectedElement) { selectedElement.remove(); deselectElement(); saveHistoryState(); }
    });
}

document.addEventListener("keydown", e => {
  if ((e.key === "Backspace" || e.key === "Delete") && selectedElement && !selectedElement.isContentEditable && document.activeElement && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      selectedElement.remove(); deselectElement(); saveHistoryState();
  }
});

const clearBtn = document.getElementById("clear-canvas-btn");
if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear canvas?")) {
        dropZone.innerHTML = "";
        if (placeholder) { dropZone.appendChild(placeholder); placeholder.style.display = "flex"; }
        if (resizeHandle) dropZone.appendChild(resizeHandle);
        deselectElement(); saveHistoryState();
      }
    });
}

// Capture first blank history state
setTimeout(saveHistoryState, 200);