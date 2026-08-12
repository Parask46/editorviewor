// Global State & Core DOM Elements
const dropZone = document.getElementById("drop-zone");
const placeholder = document.getElementById("canvas-placeholder");
const resizeHandle = document.getElementById("resize-handle");

let currentScale = 1;
let selectedElement = null;
let draggedCanvasElement = null;

// History State
let historyStack = [];
let historyIndex = -1;

// Helper: RGB to Hex for color pickers
function rgbToHexStr(col) {
    if (!col || col === "transparent" || col === "none") return "";
    if (col.startsWith("#")) {
        if(col.length === 4) return "#" + col[1]+col[1]+col[2]+col[2]+col[3]+col[3];
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

// Helper: Make nested elements draggable
function recursivelyMakeDraggable(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return;

  el.setAttribute("draggable", "true");
  el.classList.add("canvas-element");
  el.dataset.tag = el.tagName.toLowerCase();

  if (el.tagName.toLowerCase() === "svg") return;

  Array.from(el.children).forEach(child => {
    if (!["BR", "HR", "STYLE", "SCRIPT"].includes(child.tagName)) {
      recursivelyMakeDraggable(child);
    }
  });
}