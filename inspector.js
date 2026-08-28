/* --- Inspector: design panel inputs + layer controls -------------------- */
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

function updateInspector(el) {
  const style = window.getComputedStyle(el);
  const tag = el.tagName.toLowerCase();
  insp.classes.value = Array.from(el.classList).filter(c => !["canvas-element","is-selected","is-dragging"].includes(c)).join(" ");
  const isImageBox = el.dataset.imageBox === "true";
  const isImgTag = tag === "img";
  if (insp.imageUploadWrapper) insp.imageUploadWrapper.classList.toggle("hidden", !(isImageBox || isImgTag));

  if (!["img","hr","svg","input","textarea"].includes(tag)) {
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

  try { document.getElementById("insp-color-picker").value = rgbToHexStr(insp.color.value) || "#000000"; } catch (e) {}
  try { document.getElementById("insp-bg-picker").value = rgbToHexStr(insp.bg.value) || "#ffffff"; } catch (e) {}
  try { document.getElementById("insp-stroke-picker").value = rgbToHexStr(insp.strokeColor.value) || "#000000"; } catch (e) {}
}

Object.keys(insp).forEach(key => {
  const control = insp[key];
  if (!control || key.includes("imageUpload")) return;
  control.addEventListener("input", e => {
    if (!selectedElement) return;
    const val = e.target.value;
    if (key === "content") { selectedElement.innerHTML = val; recursivelyMakeDraggable(selectedElement); }
    else if (key === "classes") { selectedElement.className = `${val} canvas-element is-selected`.trim(); }
    else {
      const map = { display:"display", flexdir:"flexDirection", w:"width", h:"height", m:"margin", p:"padding", gap:"gap", color:"color", fz:"fontSize", z:"zIndex", bg:"background", br:"borderRadius" };
      if (map[key]) selectedElement.style[map[key]] = val;
      if (key === "strokeColor" || key === "strokeWidth") {
        const c = insp.strokeColor.value || "black";
        const w = insp.strokeWidth.value || "1px";
        selectedElement.style.border = (w && w !== "0" && w !== "0px") ? `${w} solid ${c}` : "none";
      }
    }
    if (typeof resizeShow === "function") resizeShow(selectedElement);
  });
  control.addEventListener("change", () => { if (typeof saveHistoryState === "function") saveHistoryState(); });
});

["color","bg","stroke"].forEach(prefix => {
  const picker = document.getElementById(`insp-${prefix}-picker`);
  const textInput = document.getElementById(prefix === "stroke" ? "insp-stroke-color" : `insp-${prefix}`);
  if (picker && textInput) {
    picker.addEventListener("input", e => { textInput.value = e.target.value; textInput.dispatchEvent(new Event("input")); });
    picker.addEventListener("change", () => { if (typeof saveHistoryState === "function") saveHistoryState(); });
  }
});

document.getElementById("btn-bring-front").addEventListener("click", () => {
  if (!selectedElement) return;
  if (typeof isStructural === "function" && isStructural(selectedElement)) {
    const textTier = (typeof minTextZIndex === "function") ? minTextZIndex() : 10;
    selectedElement.style.zIndex = String(Math.max(1, textTier - 1));
  } else {
    let maxZ = 0;
    Array.from(shadowRootInner.children).forEach(c => { if (c !== selectedElement && c.classList && c.classList.contains("canvas-element")) maxZ = Math.max(maxZ, parseInt(c.style.zIndex) || 0); });
    selectedElement.style.zIndex = String(maxZ + 1);
  }
  updateInspector(selectedElement);
  if (typeof saveHistoryState === "function") saveHistoryState();
});
document.getElementById("btn-send-back").addEventListener("click", () => {
  if (!selectedElement) return;
  if (typeof isTextLike === "function" && isTextLike(selectedElement)) {
    let maxTextZ = 0;
    Array.from(shadowRootInner.children).forEach(c => { if (c !== selectedElement && c.classList && c.classList.contains("canvas-element") && isTextLike(c)) maxTextZ = Math.max(maxTextZ, parseInt(c.style.zIndex) || 0); });
    selectedElement.style.zIndex = String(maxTextZ + 1);
  } else {
    let minZ = 0;
    Array.from(shadowRootInner.children).forEach(c => { if (c !== selectedElement && c.classList && c.classList.contains("canvas-element")) minZ = Math.min(minZ, parseInt(c.style.zIndex) || 0); });
    selectedElement.style.zIndex = String(minZ - 1);
  }
  updateInspector(selectedElement);
  if (typeof saveHistoryState === "function") saveHistoryState();
});

/* --- Image upload -------------------------------------------------------- */
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
    reader.onload = ev => {
      if (isImg) {
        selectedElement.src = ev.target.result;
      } else {
        selectedElement.innerHTML = "";
        selectedElement.style.border = "none";
        selectedElement.style.background = "transparent";
        selectedElement.style.display = "flex";
        selectedElement.style.alignItems = "center";
        selectedElement.style.justifyContent = "center";
        const img = document.createElement("img");
        img.src = ev.target.result;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "100%";
        img.style.objectFit = "cover";
        selectedElement.appendChild(img);
        recursivelyMakeDraggable(selectedElement);
      }
      if (typeof resizeShow === "function") resizeShow(selectedElement);
      if (typeof renderDOMTree === "function") renderDOMTree();
      if (typeof saveHistoryState === "function") saveHistoryState();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });
}
