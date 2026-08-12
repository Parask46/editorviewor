const treeContainer = document.getElementById("dom-tree-container");
const emptyState = document.getElementById("inspector-empty-state");

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

function renderDOMTree() {
  treeContainer.innerHTML = "";
  const rootElements = Array.from(dropZone.children).filter(el => el.id !== "canvas-placeholder" && el.id !== "resize-handle");
  if (rootElements.length === 0) {
    treeContainer.innerHTML = '<div class="text-xs text-studio-muted italic text-center mt-8">Canvas is empty</div>';
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
    if (["svg", "path"].includes(tag)) iconStr = "hexagon";
    if (["h1", "h2", "p", "span"].includes(tag)) iconStr = "type";
    if (["button", "a"].includes(tag)) iconStr = "mouse-pointer-2";
    if (["input", "form"].includes(tag)) iconStr = "file-text";

    itemDiv.innerHTML = `<i data-lucide="${iconStr}" class="w-3.5 h-3.5"></i> <span class="tree-item-tag">${tag}</span>`;
    itemDiv.addEventListener("click", e => { e.stopPropagation(); selectElement(element); });
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
      node.style.marginLeft = "0"; node.style.borderLeft = "none"; node.style.paddingLeft = "0";
      treeContainer.appendChild(node);
    }
  });
  lucide.createIcons();
}

function updateInspector(el) {
  const style = window.getComputedStyle(el);
  const tag = el.tagName.toLowerCase();

  insp.classes.value = Array.from(el.classList).filter(c => c !== "canvas-element" && c !== "is-selected").join(" ");
  const isImageBox = el.dataset.imageBox === "true";
  const isImgTag = tag === "img";

  if (insp.imageUploadWrapper) {
    insp.imageUploadWrapper.classList.toggle("hidden", !(isImageBox || isImgTag));
  }

  if (!["img", "hr", "svg", "input", "textarea"].includes(tag)) {
    insp.content.value = el.innerHTML.trim();
    insp.content.disabled = false;
  } else {
    insp.content.value = `[${tag.toUpperCase()} Element]`;
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
  insp.fz.value = el.style.fontSize ? `${Math.round(parseFloat(el.style.fontSize))}px` : style.fontSize;
  insp.z.value = el.style.zIndex || style.zIndex || "auto";
  insp.bg.value = el.style.background || el.style.backgroundColor || "";
  insp.strokeColor.value = el.style.borderColor || style.borderColor;
  insp.strokeWidth.value = el.style.borderWidth || style.borderWidth;
  insp.br.value = el.style.borderRadius || style.borderRadius;

  try { document.getElementById("insp-color-picker").value = rgbToHexStr(insp.color.value) || "#000000"; } catch(e){}
  try { document.getElementById("insp-bg-picker").value = rgbToHexStr(insp.bg.value) || "#ffffff"; } catch(e){}
  try { document.getElementById("insp-stroke-picker").value = rgbToHexStr(insp.strokeColor.value) || "#000000"; } catch(e){}
}

/* --- Inspector Input Listeners --- */
Object.keys(insp).forEach(key => {
  const control = insp[key];
  if (!control || key.includes("imageUpload")) return;

  control.addEventListener("input", e => {
    if (!selectedElement) return;
    const val = e.target.value;

    if (key === "content") { selectedElement.innerHTML = val; recursivelyMakeDraggable(selectedElement); }
    else if (key === "classes") { selectedElement.className = val + " canvas-element is-selected"; }
    else {
      const cssPropMap = { display: "display", flexdir: "flexDirection", w: "width", h: "height", m: "margin", p: "padding", gap: "gap", color: "color", fz: "fontSize", z: "zIndex", bg: "background", br: "borderRadius" };
      if (cssPropMap[key]) selectedElement.style[cssPropMap[key]] = val;
      if (key === "strokeColor" || key === "strokeWidth") {
        const c = insp.strokeColor.value || "black";
        const w = insp.strokeWidth.value || "1px";
        selectedElement.style.border = (w !== "0" && w !== "0px" && w !== "") ? `${w} solid ${c}` : "none";
      }
    }
    if (typeof updateResizeHandle === "function") updateResizeHandle();
  });
  control.addEventListener("change", () => { if(typeof saveHistoryState === "function") saveHistoryState() });
});

['color', 'bg', 'stroke'].forEach(prefix => {
    const picker = document.getElementById(`insp-${prefix}-picker`);
    const textInput = document.getElementById(prefix === 'stroke' ? 'insp-stroke-color' : `insp-${prefix}`);
    if(picker && textInput) {
        picker.addEventListener("input", (e) => { textInput.value = e.target.value; textInput.dispatchEvent(new Event("input")); });
        picker.addEventListener("change", () => { if(typeof saveHistoryState === "function") saveHistoryState() });
    }
});

/* --- Layer Actions --- */
document.getElementById("btn-bring-front").addEventListener("click", () => {
    if(!selectedElement) return;
    let maxZ = 0;
    Array.from(dropZone.children).forEach(c => { if(c !== selectedElement && c.classList.contains("canvas-element")) maxZ = Math.max(maxZ, parseInt(window.getComputedStyle(c).zIndex) || 0); });
    selectedElement.style.zIndex = maxZ + 1;
    updateInspector(selectedElement); 
    if(typeof saveHistoryState === "function") saveHistoryState();
});

document.getElementById("btn-send-back").addEventListener("click", () => {
    if(!selectedElement) return;
    let minZ = 0;
    Array.from(dropZone.children).forEach(c => { if(c !== selectedElement && c.classList.contains("canvas-element")) minZ = Math.min(minZ, parseInt(window.getComputedStyle(c).zIndex) || 0); });
    selectedElement.style.zIndex = minZ - 1;
    updateInspector(selectedElement); 
    if(typeof saveHistoryState === "function") saveHistoryState();
});

/* --- File Upload inside Inspector (For Image Boxes & standard Imgs) --- */
if (insp.imageUploadBtn && insp.imageUploadInput) {
  insp.imageUploadBtn.addEventListener("click", () => {
    const isImageBox = selectedElement?.dataset.imageBox === "true";
    const isImg = selectedElement?.tagName.toLowerCase() === "img";
    if (!selectedElement || (!isImageBox && !isImg)) return;
    
    insp.imageUploadInput.click();
  });

  insp.imageUploadInput.addEventListener("change", e => {
    const file = e.target.files[0];
    const isImageBox = selectedElement?.dataset.imageBox === "true";
    const isImg = selectedElement?.tagName.toLowerCase() === "img";

    if (!file || !selectedElement || (!isImageBox && !isImg)) return;

    const reader = new FileReader();
    reader.onload = event => {
      
      if (isImg) {
          // If it's just an image tag, replace the src directly
          selectedElement.src = event.target.result;
      } else if (isImageBox) {
          // If it's the placeholder box wrapper, inject an image inside
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
          if (typeof recursivelyMakeDraggable === "function") {
              recursivelyMakeDraggable(selectedElement);
          }
      }
      
      if (typeof updateResizeHandle === "function") updateResizeHandle();
      renderDOMTree();
      if (typeof saveHistoryState === "function") saveHistoryState();
    };

    reader.readAsDataURL(file);
    e.target.value = ""; // reset input
  });
}