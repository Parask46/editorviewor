lucide.createIcons();

/* --- Setup Scale Zoom / Auto-fit --- */
let currentScale = 1;

function updateCanvasScale() {
  const scrollArea = document.getElementById("canvas-scroll-area");
  const wrapper = document.querySelector(".artboard-wrapper");
  const artboard = document.getElementById("drop-zone");

  if (!scrollArea || !wrapper || !artboard) return;

  const availableWidth = scrollArea.clientWidth - 128;
  const availableHeight = scrollArea.clientHeight - 128;

  const canvasW = 1200;
  const canvasH = 800;

  const scaleX = availableWidth / canvasW;
  const scaleY = availableHeight / canvasH;

  currentScale = Math.min(scaleX, scaleY);
  currentScale = Math.max(0.2, Math.min(currentScale, 1.5));

  artboard.style.transform = `scale(${currentScale})`;
  wrapper.style.width = `${canvasW * currentScale}px`;
  wrapper.style.height = `${canvasH * currentScale}px`;
}

window.addEventListener("resize", updateCanvasScale);
setTimeout(updateCanvasScale, 50);

/* --- Left Sidebar Collapsible Logic --- */
const leftSidebar = document.getElementById("left-sidebar");
const toggleLeftSidebarBtn = document.getElementById("toggle-left-sidebar-btn");
let leftSidebarCollapsed = false;

toggleLeftSidebarBtn.addEventListener("click", () => {
    leftSidebarCollapsed = !leftSidebarCollapsed;
    if (leftSidebarCollapsed) {
        leftSidebar.classList.add("collapsed");
        toggleLeftSidebarBtn.innerHTML = `<i data-lucide="panel-left-open" class="w-4 h-4"></i>`;
    } else {
        leftSidebar.classList.remove("collapsed");
        toggleLeftSidebarBtn.innerHTML = `<i data-lucide="panel-left-close" class="w-4 h-4"></i>`;
    }
    lucide.createIcons();
    setTimeout(updateCanvasScale, 310);
});

/* --- Toggle Right Panel & Tabs Logic --- */
const rightSidebar = document.getElementById("right-sidebar-wrapper");
const toggleTabBtn = document.getElementById("properties-toggle-tab");
const closeInspectorBtn = document.getElementById("close-inspector-btn");
const emptyState = document.getElementById("inspector-empty-state");
const openInspectorToolbarBtn = document.getElementById("open-inspector-toolbar-btn");

if (openInspectorToolbarBtn) {
  openInspectorToolbarBtn.addEventListener("click", () => {
    if (rightSidebar.classList.contains("collapsed")) {
      openInspector();
    } else {
      closeInspector();
    }
  });
}

function openInspector() {
  rightSidebar.classList.remove("collapsed");
  rightSidebar.classList.add("expanded");
  setTimeout(updateCanvasScale, 310);
}

function closeInspector() {
  rightSidebar.classList.add("collapsed");
  rightSidebar.classList.remove("expanded");
  setTimeout(updateCanvasScale, 310);
}

toggleTabBtn.addEventListener("click", () => {
  if (rightSidebar.classList.contains("collapsed")) openInspector();
  else closeInspector();
});

closeInspectorBtn.addEventListener("click", closeInspector);

/* --- Handle Tabs --- */
const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* --- DRAG & DROP ENGINE core refs --- */
const dropZone = document.getElementById("drop-zone");
const placeholder = document.getElementById("canvas-placeholder");

let draggedCanvasElement = null;
let selectedElement = null;

/* --- DOM Tree Visualizer Engine --- */
const treeContainer = document.getElementById("dom-tree-container");

function renderDOMTree() {
  treeContainer.innerHTML = "";
  const rootElements = Array.from(dropZone.children).filter(
    el => el.id !== "canvas-placeholder" && el.id !== "resize-handle"
  );

  if (rootElements.length === 0) {
    treeContainer.innerHTML =
      '<div class="text-xs text-studio-muted italic text-center mt-8">Canvas is empty</div>';
    return;
  }

  const buildTreeNode = (element, depth) => {
    if (!element.classList || !element.classList.contains("canvas-element")) return null;

    const nodeDiv = document.createElement("div");
    nodeDiv.className = "tree-node";

    const itemDiv = document.createElement("div");
    itemDiv.className = "tree-item";
    if (element === selectedElement) itemDiv.classList.add("tree-selected");

    const tag = element.tagName.toLowerCase();
    let iconStr = "layout";
    if (tag === "img") iconStr = "image";
    if (["svg", "path", "rect", "circle", "ellipse", "polygon"].includes(tag)) iconStr = "hexagon";
    if (["h1", "h2", "h3"].includes(tag)) iconStr = "heading";
    if (["p", "span", "b", "i"].includes(tag)) iconStr = "type";
    if (["button", "a"].includes(tag)) iconStr = "mouse-pointer-2";
    if (["table", "tr", "td"].includes(tag)) iconStr = "table";
    if (["input", "textarea", "form"].includes(tag)) iconStr = "file-text";

    let textSnippet = "";
    if (element.children.length === 0 && element.textContent.trim()) {
      textSnippet =
        '"' +
        element.textContent.trim().substring(0, 15) +
        (element.textContent.length > 15 ? "..." : "") +
        '"';
    } else if (tag === "svg") {
      textSnippet = "(Shape)";
    } else if (tag === "input") {
      textSnippet = "(Input Field)";
    }

    itemDiv.innerHTML = `
      <i data-lucide="${iconStr}" class="w-3.5 h-3.5"></i>
      <span class="tree-item-tag">${tag}</span>
      ${textSnippet ? `<span class="tree-item-text">${textSnippet}</span>` : ""}
    `;

    itemDiv.addEventListener("click", e => {
      e.stopPropagation();
      selectElement(element);
    });

    nodeDiv.appendChild(itemDiv);

    Array.from(element.children).forEach(child => {
      const childNode = buildTreeNode(child, depth + 1);
      if (childNode) nodeDiv.appendChild(childNode);
    });

    return nodeDiv;
  };

  rootElements.forEach(el => {
    const node = buildTreeNode(el, 0);
    if (node) {
      node.style.marginLeft = "0";
      node.style.borderLeft = "none";
      node.style.paddingLeft = "0";
      treeContainer.appendChild(node);
    }
  });

  lucide.createIcons();
}

/* --- COMPREHENSIVE CATEGORIZED LIBRARY (EXPANDED WIX-STYLE) --- */
const libraryContainer = document.getElementById("library-container");

const libraryCategories = {
  "Basic Elements": [
    {
      icon: "heading", label: "Title",
      html: `<h1 style="font-size: 48px; color: #000000; margin: 0; font-weight: 700;">Heading</h1>`
    },
    {
      icon: "align-left", label: "Paragraph",
      html: `<p style="font-size: 16px; color: #404040; margin: 0; max-width: 300px; line-height: 1.5;">This is a paragraph. Double click to edit this text directly.</p>`
    },
    {
      icon: "image", label: "Image Box",
      html: `<div style="width: 200px; height: 200px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 2px dashed #9ca3af; color: #6b7280; font-weight: 600;" data-image-box="true">Image Box</div>`
    },
    {
      icon: "video", label: "Video Placeholder",
      html: `<div style="width: 320px; height: 180px; background: #1a1a1a; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #ffffff; font-weight: 600;"><i data-lucide="play-circle" style="width:48px;height:48px;opacity:0.8;"></i></div>`
    },
    {
      icon: "mouse-pointer-2", label: "Button",
      html: `<button style="background: #2563eb; color: #ffffff; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer;">Click Me</button>`
    }
  ],
  "Layout & Structure": [
    {
      icon: "box", label: "Container",
      html: `<div style="background:#ffffff; padding:20px; border:1px solid #ddd; border-radius:8px; width: 250px; height: 150px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"></div>`
    },
    {
      icon: "columns", label: "2 Columns (Flex)",
      html: `<div style="display: flex; gap: 20px; width: 100%; min-height: 150px; padding: 20px; background: #f9f9f9; box-sizing: border-box;"><div style="flex: 1; background: #ffffff; padding: 20px; border: 1px dashed #ccc;">Column 1</div><div style="flex: 1; background: #ffffff; padding: 20px; border: 1px dashed #ccc;">Column 2</div></div>`
    },
    {
      icon: "layout-grid", label: "3 Grid Items",
      html: `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; width: 100%; min-height: 150px; padding: 20px; background: #f9f9f9; box-sizing: border-box;"><div style="background: #ffffff; padding: 20px; border: 1px dashed #ccc;">Item 1</div><div style="background: #ffffff; padding: 20px; border: 1px dashed #ccc;">Item 2</div><div style="background: #ffffff; padding: 20px; border: 1px dashed #ccc;">Item 3</div></div>`
    }
  ],
  "Page Sections": [
    {
      icon: "menu", label: "Header / Nav",
      html: `<nav style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background: #ffffff; border-bottom: 1px solid #eaeaea; box-sizing: border-box;"><div style="font-weight: bold; font-size: 24px;">Logo</div><div style="display: flex; gap: 20px; font-size: 14px; font-weight: 500;"><span>Home</span><span>About</span><span>Contact</span></div></nav>`
    },
    {
      icon: "monitor", label: "Hero Banner",
      html: `<section style="width: 100%; min-height: 400px; background: #2563eb; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; box-sizing: border-box;"><h1 style="font-size: 48px; margin-bottom: 20px; font-weight: 700;">Welcome to Our Site</h1><p style="font-size: 20px; max-width: 600px; margin-bottom: 30px;">A catchy subtitle to grab attention.</p><button style="background: #ffffff; color: #2563eb; padding: 12px 24px; border: none; border-radius: 4px; font-weight: bold;">Get Started</button></section>`
    },
    {
      icon: "layout-template", label: "Page Strip",
      html: `<div style="width: 100%; min-height: 250px; background: #f3f4f6; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;"><h2 style="margin: 0; color: #111827; font-size: 32px; font-weight: bold;">Full Width Strip</h2></div>`
    },
    {
      icon: "layout", label: "Sidebar",
      html: `<aside style="width: 250px; min-height: 400px; background: #ffffff; padding: 20px; border-right: 1px solid #eaeaea; box-sizing: border-box;"><h3 style="margin-top:0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Menu</h3><ul style="list-style:none; padding:0; margin:0;"><li style="padding: 10px 0; color: #444;">Dashboard</li><li style="padding: 10px 0; color: #444;">Settings</li><li style="padding: 10px 0; color: #444;">Profile</li></ul></aside>`
    },
    {
      icon: "arrow-down-to-line", label: "Footer",
      html: `<footer style="width: 100%; padding: 40px; background: #111827; color: #9ca3af; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;"><div><h4 style="color:#ffffff; margin: 0 0 5px 0;">Company Name</h4><p style="margin:0; font-size:12px;">123 Web Street, Internet</p></div><div style="font-size: 12px;">&copy; 2026 All rights reserved.</div></footer>`
    }
  ],
  "Forms & Inputs": [
    {
      icon: "type", label: "Text Input",
      html: `<input type="text" placeholder="Enter text here..." style="padding: 10px 15px; border: 1px solid #ccc; border-radius: 4px; width: 250px; font-size: 14px;" />`
    },
    {
      icon: "align-justify", label: "Textarea",
      html: `<textarea placeholder="Type your message..." style="padding: 10px 15px; border: 1px solid #ccc; border-radius: 4px; width: 300px; height: 100px; font-size: 14px; font-family: sans-serif; resize: none;"></textarea>`
    },
    {
      icon: "file-text", label: "Contact Form",
      html: `<form style="background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #eaeaea; display: flex; flex-direction: column; gap: 15px; width: 350px; box-sizing: border-box;"><h3 style="margin: 0 0 10px 0; font-size: 20px;">Contact Us</h3><input type="text" placeholder="Your Name" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box;" /><input type="email" placeholder="Your Email" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box;" /><textarea placeholder="How can we help?" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; height: 80px; width: 100%; box-sizing: border-box; resize: none; font-family: sans-serif;"></textarea><button type="button" style="background: #000000; color: #ffffff; border: none; padding: 12px; border-radius: 4px; cursor: pointer; font-weight: 600; width: 100%;">Submit Form</button></form>`
    }
  ]
};

libraryContainer.innerHTML = "";

Object.keys(libraryCategories).forEach(categoryName => {
  const header = document.createElement("div");
  header.className =
    "prop-label mb-2 text-white border-b border-studio-border pb-1 mt-2 first:mt-0";
  header.innerText = categoryName;

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-3 gap-2 mb-4";

  libraryCategories[categoryName].forEach(item => {
    const card = document.createElement("div");
    card.className = "library-card group";
    card.draggable = true;
    card.dataset.html = item.html;

    card.innerHTML = `
      <div class="text-studio-muted group-hover:text-studio-accent transition-colors">
        <i data-lucide="${item.icon}" class="w-6 h-6"></i>
      </div>
      <span class="text-[9px] font-medium text-studio-muted group-hover:text-studio-text transition-colors mt-1">${item.label}</span>
    `;

    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", card.dataset.html);
      e.dataTransfer.setData("source", "library");
      card.classList.add("opacity-50", "border-studio-accent");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("opacity-50", "border-studio-accent");
    });

    grid.appendChild(card);
  });

  libraryContainer.appendChild(header);
  libraryContainer.appendChild(grid);
});

function recursivelyMakeDraggable(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return;

  el.setAttribute("draggable", "true");
  el.classList.add("canvas-element");
  el.dataset.tag = el.tagName.toLowerCase();

  // Protect internal SVGs (like the video placeholder icon)
  if (el.tagName.toLowerCase() === "svg") return;

  Array.from(el.children).forEach(child => {
    if (!["BR", "HR", "STYLE", "SCRIPT"].includes(child.tagName)) {
      recursivelyMakeDraggable(child);
    }
  });
}

/* --- Modals & PC Uploads --- */
const imageUploadInput = document.getElementById("image-upload-input");
if (imageUploadInput) {
  imageUploadInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = document.createElement("img");
      img.src = event.target.result;
      img.style.width = "300px";

      dropZone.appendChild(img);
      recursivelyMakeDraggable(img);
      if (placeholder) placeholder.style.display = "none";
      selectElement(img);
      renderDOMTree();
    };
    reader.readAsDataURL(file);
    this.value = "";
  });
}

const htmlModal = document.getElementById("html-modal");
document
  .getElementById("open-html-modal-btn")
  .addEventListener("click", () => htmlModal.classList.add("active"));
document
  .getElementById("close-modal-btn")
  .addEventListener("click", () => htmlModal.classList.remove("active"));
htmlModal.addEventListener("click", e => {
  if (e.target === htmlModal) htmlModal.classList.remove("active");
});

function injectHtmlToCanvas(htmlString) {
  if (!htmlString.trim()) return;

  const temp = document.createElement("div");
  temp.innerHTML = htmlString.trim();

  Array.from(temp.children).forEach(newEl => {
    dropZone.appendChild(newEl);
    recursivelyMakeDraggable(newEl);
  });

  if (placeholder) placeholder.style.display = "none";
  if (dropZone.lastElementChild) selectElement(dropZone.lastElementChild);
  htmlModal.classList.remove("active");
  document.getElementById("raw-html-input").value = "";
  renderDOMTree();
}

document.getElementById("insert-html-btn").addEventListener("click", () => {
  injectHtmlToCanvas(document.getElementById("raw-html-input").value);
});


/* --- FREEFORM DRAG & DROP ENGINE --- */

let dragOffsetX = 0;
let dragOffsetY = 0;

dropZone.addEventListener("click", e => {
  if (e.target.isContentEditable || e.target.id === "resize-handle") return;

  const el = e.target.closest(".canvas-element");
  if (el) selectElement(el);
  else deselectElement();
});

dropZone.addEventListener("dragstart", e => {
  const el = e.target.closest(".canvas-element");
  if (!el || el.isContentEditable) {
    e.preventDefault();
    return;
  }

  e.stopPropagation();
  draggedCanvasElement = el;
  e.dataTransfer.setData("text/plain", "existing");
  e.dataTransfer.effectAllowed = "move";

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
  dragOffsetX = 0;
  dragOffsetY = 0;
});

dropZone.addEventListener("dragover", e => {
  e.preventDefault(); 
  e.dataTransfer.dropEffect = "move";
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  if (placeholder) placeholder.style.display = "none";

  const source = e.dataTransfer.getData("source");
  let elToInsert = draggedCanvasElement;

  if (source === "library") {
    const html = e.dataTransfer.getData("text/plain");
    if (html) {
      const temp = document.createElement("div");
      temp.innerHTML = html.trim();
      elToInsert = temp.firstElementChild;
      if (elToInsert) recursivelyMakeDraggable(elToInsert);
    }
    dragOffsetX = 20; 
    dragOffsetY = 20; 
  }

  if (!elToInsert) return;

  const dropRect = dropZone.getBoundingClientRect();
  const dropX = (e.clientX - dropRect.left) / currentScale - dragOffsetX;
  const dropY = (e.clientY - dropRect.top) / currentScale - dragOffsetY;

  elToInsert.style.left = `${dropX}px`;
  elToInsert.style.top = `${dropY}px`;
  elToInsert.style.margin = "0"; 

  dropZone.appendChild(elToInsert);

  recursivelyMakeDraggable(elToInsert);
  selectElement(elToInsert);
  updateResizeHandle(); 
  renderDOMTree();
});

dropZone.addEventListener("dblclick", e => {
  const el = e.target.closest(".canvas-element");
  // Prevent forms/inputs from breaking when double clicked
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
          updateInspector(el);
          updateResizeHandle();
      }
      renderDOMTree();
      el.removeEventListener("blur", onBlur);
    });
  }
});

document.getElementById("select-parent-btn").addEventListener("click", () => {
  if (
    selectedElement &&
    selectedElement.parentElement &&
    selectedElement.parentElement.classList.contains("canvas-element")
  ) {
    selectElement(selectedElement.parentElement);
  }
});

document.getElementById("clear-canvas-btn").addEventListener("click", () => {
  if (confirm("Are you sure you want to clear the canvas?")) {
    dropZone.innerHTML = "";
    if (placeholder) {
      dropZone.appendChild(placeholder);
      placeholder.style.display = "flex";
    }
    
    const newHandle = document.createElement("div");
    newHandle.id = "resize-handle";
    newHandle.style.display = "none";
    dropZone.appendChild(newHandle);
    
    deselectElement();
    renderDOMTree();
  }
});

/* --- RESIZE ENGINE (With Font Scaling) --- */
const resizeHandle = document.getElementById("resize-handle");
let isResizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let startWidth = 0;
let startHeight = 0;
let startFontSize = 16;

function updateResizeHandle() {
  const rh = document.getElementById("resize-handle");
  if (!rh) return;
  
  if (!selectedElement || selectedElement === dropZone) {
    rh.style.display = "none";
    return;
  }
  
  rh.style.display = "block";
  rh.style.left = `${selectedElement.offsetLeft + selectedElement.offsetWidth - 6}px`;
  rh.style.top = `${selectedElement.offsetTop + selectedElement.offsetHeight - 6}px`;
}

if (resizeHandle) {
    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation(); 
      if (!selectedElement) return;

      isResizing = true;
      document.getElementById("resize-handle").classList.add("active");
      
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      startWidth = selectedElement.offsetWidth;
      startHeight = selectedElement.offsetHeight;
      
      // Capture the current font size of the selected element to use as our base for scaling
      const computedFont = window.getComputedStyle(selectedElement).fontSize;
      startFontSize = parseFloat(computedFont) || 16;
    });
}

window.addEventListener("mousemove", (e) => {
  if (!isResizing || !selectedElement) return;

  const dx = (e.clientX - resizeStartX) / currentScale;
  const dy = (e.clientY - resizeStartY) / currentScale;

  const newWidth = Math.max(20, startWidth + dx);
  const newHeight = Math.max(20, startHeight + dy);

  selectedElement.style.width = `${newWidth}px`;
  selectedElement.style.height = `${newHeight}px`;

  if (insp.w) insp.w.value = `${newWidth}px`;
  if (insp.h) insp.h.value = `${newHeight}px`;

  // --- AUTO FONT SCALING LOGIC ---
  // We calculate the scale ratio based on the diagonal growth to make font scaling proportional and smooth
  const startDiag = Math.sqrt(startWidth * startWidth + startHeight * startHeight);
  const newDiag = Math.sqrt(newWidth * newWidth + newHeight * newHeight);
  const scaleRatio = newDiag / startDiag;
  
  const newFontSize = startFontSize * scaleRatio;
  
  // Apply the newly scaled font size
  selectedElement.style.fontSize = `${newFontSize}px`;
  
  // Instantly reflect it in the inspector
  if (insp.fz) insp.fz.value = `${Math.round(newFontSize)}px`;

  updateResizeHandle();
});

window.addEventListener("mouseup", () => {
  if (isResizing) {
    isResizing = false;
    const rh = document.getElementById("resize-handle");
    if (rh) rh.classList.remove("active");
    renderDOMTree(); 
  }
});


/* --- Inspector Logic --- */
const insp = {
  classes: document.getElementById("insp-classes"),
  content: document.getElementById("insp-content"),
  display: document.getElementById("insp-display"),
  flexdir: document.getElementById("insp-flexdir"),
  w: document.getElementById("insp-w"),
  h: document.getElementById("insp-h"),
  m: document.getElementById("insp-m"),
  p: document.getElementById("insp-p"),
  gap: document.getElementById("insp-gap"),
  color: document.getElementById("insp-color"),
  fz: document.getElementById("insp-fz"),
  bg: document.getElementById("insp-bg"),
  br: document.getElementById("insp-br"),
  strokeColor: document.getElementById("insp-stroke-color"),
  strokeWidth: document.getElementById("insp-stroke-width"),
  z: document.getElementById("insp-z"),
  imageUploadWrapper: document.getElementById("image-upload-inspector"),
  imageUploadBtn: document.getElementById("insp-image-upload-btn"),
  imageUploadInput: document.getElementById("insp-image-upload-input")
};

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

function selectElement(el) {
  if (selectedElement) selectedElement.classList.remove("is-selected");
  selectedElement = el;
  selectedElement.classList.add("is-selected");

  emptyState.classList.add("hidden");
  document.getElementById("insp-tag-name").innerText = el.tagName.toLowerCase();
  updateInspector(el);
  updateResizeHandle(); 
  renderDOMTree();
}

function deselectElement() {
  if (selectedElement) {
    selectedElement.classList.remove("is-selected");
    selectedElement = null;
    emptyState.classList.remove("hidden");
    updateResizeHandle(); 
    renderDOMTree();
  }
}

function updateInspector(el) {
  const style = window.getComputedStyle(el);
  const tag = el.tagName.toLowerCase();

  const cleanClasses = Array.from(el.classList)
    .filter(c => c !== "canvas-element" && c !== "is-selected")
    .join(" ");
  insp.classes.value = cleanClasses;

  const isShape = tag === "svg";
  const innerShape = isShape ? el.firstElementChild : null;
  const isImageBox = el.dataset.imageBox === "true";

  if (insp.imageUploadWrapper) {
    insp.imageUploadWrapper.classList.toggle("hidden", !isImageBox);
  }

  if (!["img", "hr", "svg", "input", "textarea"].includes(tag)) {
    insp.content.value = el.innerHTML.trim();
    insp.content.disabled = false;
  } else {
    if (tag === "svg") insp.content.value = "[SVG Shape]";
    else if (tag === "img") insp.content.value = "[Image Element]";
    else if (tag === "input") insp.content.value = "[Input Field]";
    else if (tag === "textarea") insp.content.value = "[Text Area]";
    else insp.content.value = "[Void Element]";
    insp.content.disabled = true;
  }

  insp.display.value = el.style.display || style.display;
  insp.flexdir.value = el.style.flexDirection || style.flexDirection;
  insp.w.value = el.style.width || style.width;
  insp.h.value = el.style.height || style.height;
  insp.m.value = el.style.margin || style.margin;
  insp.p.value = el.style.padding || style.padding;
  insp.gap.value = el.style.gap || style.gap;
  insp.color.value = el.style.color || style.color;
  
  // Format the font size carefully, removing heavy decimals
  if (el.style.fontSize) {
     insp.fz.value = `${Math.round(parseFloat(el.style.fontSize))}px`;
  } else {
     insp.fz.value = style.fontSize;
  }
  
  insp.z.value = el.style.zIndex || style.zIndex || "auto";

  if (isShape && innerShape) {
    insp.bg.value = innerShape.getAttribute("fill") || "";
    insp.strokeColor.value = innerShape.getAttribute("stroke") || "";
    insp.strokeWidth.value = innerShape.getAttribute("stroke-width") || "";
    insp.br.value = innerShape.getAttribute("rx") || "";
  } else {
    insp.bg.value = el.style.background || el.style.backgroundColor || "";
    const bColor = el.style.borderColor || style.borderColor;
    const bWidth = el.style.borderWidth || style.borderWidth;
    insp.strokeColor.value = bColor;
    insp.strokeWidth.value = bWidth;
    insp.br.value = el.style.borderRadius || style.borderRadius;
  }
  
  try { document.getElementById("insp-color-picker").value = rgbToHexStr(insp.color.value) || "#000000"; } catch(e){}
  try { document.getElementById("insp-bg-picker").value = rgbToHexStr(insp.bg.value) || "#ffffff"; } catch(e){}
  try { document.getElementById("insp-stroke-picker").value = rgbToHexStr(insp.strokeColor.value) || "#000000"; } catch(e){}
}

/* --- Inspector inputs (CSS / content) --- */
Object.keys(insp).forEach(key => {
  const control = insp[key];
  if (!control || key === "imageUploadWrapper" || key === "imageUploadBtn" || key === "imageUploadInput")
    return;

  control.addEventListener("input", e => {
    if (!selectedElement) return;

    const val = e.target.value;
    const tag = selectedElement.tagName.toLowerCase();
    const isShape = tag === "svg";
    const innerShape = isShape ? selectedElement.firstElementChild : null;

    if (key === "content") {
      selectedElement.innerHTML = val;
      recursivelyMakeDraggable(selectedElement);
      updateResizeHandle();
      renderDOMTree();
      return;
    }

    if (key === "classes") {
      selectedElement.className = val;
      recursivelyMakeDraggable(selectedElement);
      selectedElement.classList.add("is-selected");
      updateResizeHandle();
      return;
    }

    const cssPropMap = {
      display: "display",
      flexdir: "flexDirection",
      w: "width",
      h: "height",
      m: "margin",
      p: "padding",
      gap: "gap",
      color: "color",
      fz: "fontSize",
      z: "zIndex"
    };

    if (cssPropMap[key]) selectedElement.style[cssPropMap[key]] = val;

    if (isShape && innerShape) {
      if (key === "bg") innerShape.setAttribute("fill", val);
      if (key === "strokeColor") innerShape.setAttribute("stroke", val);
      if (key === "strokeWidth") innerShape.setAttribute("stroke-width", val);
      if (key === "br") {
        innerShape.setAttribute("rx", val.replace("px", ""));
        innerShape.setAttribute("ry", val.replace("px", ""));
      }
    } else {
      if (key === "bg") selectedElement.style.background = val;
      if (key === "br") selectedElement.style.borderRadius = val;
      if (key === "strokeColor" || key === "strokeWidth") {
        const c = insp.strokeColor.value || "black";
        const w = insp.strokeWidth.value || "1px";
        selectedElement.style.border =
          w !== "0" && w !== "0px" && w !== "" ? `${w} solid ${c}` : "none";
      }
    }
    
    if(key === "color") try { document.getElementById("insp-color-picker").value = rgbToHexStr(val); } catch(e){}
    if(key === "bg") try { document.getElementById("insp-bg-picker").value = rgbToHexStr(val); } catch(e){}
    if(key === "strokeColor") try { document.getElementById("insp-stroke-picker").value = rgbToHexStr(val); } catch(e){}
    
    updateResizeHandle();
  });
});

['color', 'bg', 'stroke'].forEach(prefix => {
    const picker = document.getElementById(`insp-${prefix}-picker`);
    const textInput = document.getElementById(prefix === 'stroke' ? 'insp-stroke-color' : `insp-${prefix}`);
    if(picker && textInput) {
        picker.addEventListener("input", (e) => {
            textInput.value = e.target.value;
            textInput.dispatchEvent(new Event("input"));
        });
    }
});

/* --- Layering Actions --- */
document.getElementById("btn-bring-front").addEventListener("click", () => {
    if(!selectedElement) return;
    let maxZ = 0;
    Array.from(dropZone.children).forEach(child => {
        if(child !== selectedElement && child.classList.contains("canvas-element")) {
            const z = parseInt(window.getComputedStyle(child).zIndex) || 0;
            if(z > maxZ) maxZ = z;
        }
    });
    selectedElement.style.zIndex = maxZ + 1;
    updateInspector(selectedElement);
});

document.getElementById("btn-send-back").addEventListener("click", () => {
    if(!selectedElement) return;
    let minZ = 0;
    Array.from(dropZone.children).forEach(child => {
        if(child !== selectedElement && child.classList.contains("canvas-element")) {
            const z = parseInt(window.getComputedStyle(child).zIndex) || 0;
            if(z < minZ) minZ = z;
        }
    });
    selectedElement.style.zIndex = minZ - 1;
    updateInspector(selectedElement);
});

if (insp.imageUploadBtn && insp.imageUploadInput) {
  insp.imageUploadBtn.addEventListener("click", () => {
    if (!selectedElement || selectedElement.dataset.imageBox !== "true") return;
    insp.imageUploadInput.click();
  });

  insp.imageUploadInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file || !selectedElement || selectedElement.dataset.imageBox !== "true") return;

    const reader = new FileReader();
    reader.onload = event => {
      selectedElement.innerHTML = "";
      selectedElement.style.border = "none";
      selectedElement.style.background = "transparent";
      selectedElement.style.justifyContent = "center";
      selectedElement.style.alignItems = "center";
      selectedElement.style.display = "flex";

      const img = document.createElement("img");
      img.src = event.target.result;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "cover";

      selectedElement.appendChild(img);
      recursivelyMakeDraggable(selectedElement);
      updateResizeHandle();
      renderDOMTree();
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  });
}

document.getElementById("delete-el-btn").addEventListener("click", () => {
  if (selectedElement) {
    selectedElement.remove();
    deselectElement();
    renderDOMTree();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Backspace" || e.key === "Delete") {
    if (
      selectedElement &&
      !selectedElement.isContentEditable &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA"
    ) {
      selectedElement.remove();
      deselectElement();
      renderDOMTree();
    }
  }
});

document.getElementById("export-btn").addEventListener("click", async () => {
  deselectElement(); 
  const clone = dropZone.cloneNode(true);

  const ph = clone.querySelector("#canvas-placeholder");
  if (ph) ph.remove();
  
  const rh = clone.querySelector("#resize-handle"); 
  if (rh) rh.remove(); 

  clone.querySelectorAll(".canvas-element").forEach(el => {
    el.removeAttribute("draggable");
    el.removeAttribute("data-tag");
    el.classList.remove("canvas-element", "is-dragging", "is-selected");
    if (el.classList.length === 0) el.removeAttribute("class");
  });

  let cleanCode = clone.innerHTML.trim();
  if (!cleanCode) return alert("Canvas is empty!");

  const format = document.getElementById("export-format").value;
  if (format === "react") {
    cleanCode = cleanCode
      .replace(/class=/g, "className=")
      .replace(/<br>/gi, "<br />")
      .replace(/<hr>/gi, "<hr />")
      .replace(/<img([^>]+)>/g, "<img$1 />")
      .replace(/<input([^>]+)>/gi, "<input$1 />")
      .replace(/style="([^"]*)"/g, (match, styleString) => {
        const rules = styleString.split(";").filter(r => r.trim());
        const objLines = rules
          .map(rule => {
            const parts = rule.split(":");
            if (parts.length < 2) return "";
            const key = parts[0]
              .trim()
              .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            const val = parts
              .slice(1)
              .join(":")
              .trim();
            return key + ": '" + val + "'";
          })
          .filter(Boolean);
        return "style={{ " + objLines.join(", ") + " }}";
      });

    cleanCode = `export default function MyComponent() {
  return (
    <div className="relative w-full h-screen">
      ${cleanCode.split("\n").join("\n      ")}
    </div>
  );
}`;
  }

  try {
    await navigator.clipboard.writeText(cleanCode);
    const btn = document.getElementById("export-btn");
    const origHtml = btn.innerHTML;

    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-black"></i> Copied!`;
    btn.classList.replace("bg-studio-accent", "bg-white");
    btn.classList.replace("hover:bg-studio-accentHover", "hover:bg-gray-100");
    lucide.createIcons();

    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.classList.replace("bg-white", "bg-studio-accent");
      btn.classList.replace("hover:bg-gray-100", "hover:bg-studio-accentHover");
      lucide.createIcons();
    }, 2000);
  } catch (err) {
    alert("Failed to copy to clipboard.");
  }
});

lucide.createIcons();