/* --- UI: zoom, sidebars, tabs, modal, export ---------------------------- */
lucide.createIcons();

function updateCanvasScale() {
  const scrollArea = document.getElementById("canvas-scroll-area");
  const wrapper = document.querySelector(".artboard-wrapper");
  if (!scrollArea || !wrapper || !dropZone) return;
  const availableWidth = scrollArea.clientWidth - 128;
  const availableHeight = scrollArea.clientHeight - 128;
  const canvasW = 1200, canvasH = 800;
  const scaleX = availableWidth / canvasW;
  const scaleY = availableHeight / canvasH;
  currentScale = Math.max(0.2, Math.min(Math.min(scaleX, scaleY), 1.5));
  dropZone.style.transform = `scale(${currentScale})`;
  wrapper.style.width = `${canvasW * currentScale}px`;
  wrapper.style.height = `${canvasH * currentScale}px`;
}
window.addEventListener("resize", updateCanvasScale);
setTimeout(updateCanvasScale, 50);

/* --- Sidebars & tabs ----------------------------------------------------- */
const leftSidebar = document.getElementById("left-sidebar");
const toggleLeftSidebarBtn = document.getElementById("toggle-left-sidebar-btn");
let leftSidebarCollapsed = false;
toggleLeftSidebarBtn.addEventListener("click", () => {
  leftSidebarCollapsed = !leftSidebarCollapsed;
  leftSidebar.classList.toggle("collapsed", leftSidebarCollapsed);
  toggleLeftSidebarBtn.innerHTML = leftSidebarCollapsed ? `<i data-lucide="panel-left-open" class="w-4 h-4"></i>` : `<i data-lucide="panel-left-close" class="w-4 h-4"></i>`;
  lucide.createIcons();
  setTimeout(updateCanvasScale, 310);
});

const rightSidebar = document.getElementById("right-sidebar-wrapper");
const toggleTabBtn = document.getElementById("properties-toggle-tab");
const closeInspectorBtn = document.getElementById("close-inspector-btn");
const openInspectorToolbarBtn = document.getElementById("open-inspector-toolbar-btn");
function toggleInspector(forceOpen) {
  const collapsed = rightSidebar.classList.contains("collapsed");
  if (forceOpen === true || collapsed) { rightSidebar.classList.remove("collapsed"); rightSidebar.classList.add("expanded"); }
  else { rightSidebar.classList.add("collapsed"); rightSidebar.classList.remove("expanded"); }
  setTimeout(updateCanvasScale, 310);
}
if (openInspectorToolbarBtn) openInspectorToolbarBtn.addEventListener("click", () => toggleInspector(true));
toggleTabBtn.addEventListener("click", () => toggleInspector());
closeInspectorBtn.addEventListener("click", () => toggleInspector(false));

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* --- Modal: import raw HTML --------------------------------------------- */
const htmlModal = document.getElementById("html-modal");
document.getElementById("open-html-modal-btn").addEventListener("click", () => htmlModal.classList.add("active"));
document.getElementById("close-modal-btn").addEventListener("click", () => htmlModal.classList.remove("active"));
htmlModal.addEventListener("click", e => { if (e.target === htmlModal) htmlModal.classList.remove("active"); });

document.getElementById("insert-html-btn").addEventListener("click", () => {
  const htmlString = document.getElementById("raw-html-input").value;
  if (!htmlString.trim()) return;
  const temp = document.createElement("div");
  temp.innerHTML = htmlString.trim();
  let cursorY = 40;
  Array.from(temp.children).forEach(newEl => {
    recursivelyMakeDraggable(newEl);
    newEl.style.position = "absolute";
    newEl.style.left = "40px";
    newEl.style.top  = `${cursorY}px`;
    newEl.style.margin = "0";
    shadowRootInner.appendChild(newEl);
    assignSmartZIndex(newEl);
    findNonOverlappingPosition(newEl, 40, cursorY);
    cursorY += (newEl.offsetHeight || 80) + 24;
  });
  if (placeholder) placeholder.style.display = "none";
  if (shadowRootInner.lastElementChild) selectElement(shadowRootInner.lastElementChild);
  htmlModal.classList.remove("active");
  document.getElementById("raw-html-input").value = "";
  if (typeof renderDOMTree === "function") renderDOMTree();
  if (typeof saveHistoryState === "function") saveHistoryState();
});

/* --- Export -------------------------------------------------------------- */
document.getElementById("export-btn").addEventListener("click", async () => {
  deselectElement();
  const fmt = document.getElementById("export-format").value;
  if (fmt === "react") return exportReact();
  return exportStandalone();
});
