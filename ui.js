lucide.createIcons();

/* --- Setup Scale Zoom / Auto-fit --- */
function updateCanvasScale() {
  const scrollArea = document.getElementById("canvas-scroll-area");
  const wrapper = document.querySelector(".artboard-wrapper");
  if (!scrollArea || !wrapper || !dropZone) return;

  const availableWidth = scrollArea.clientWidth - 128;
  const availableHeight = scrollArea.clientHeight - 128;
  const canvasW = 1200;
  const canvasH = 800;

  const scaleX = availableWidth / canvasW;
  const scaleY = availableHeight / canvasH;

  currentScale = Math.max(0.2, Math.min(Math.min(scaleX, scaleY), 1.5));

  dropZone.style.transform = `scale(${currentScale})`;
  wrapper.style.width = `${canvasW * currentScale}px`;
  wrapper.style.height = `${canvasH * currentScale}px`;
}

window.addEventListener("resize", updateCanvasScale);
setTimeout(updateCanvasScale, 50);

/* --- Sidebars & Tabs Logic --- */
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
  const isCollapsed = rightSidebar.classList.contains("collapsed");
  if (forceOpen === true || isCollapsed) {
    rightSidebar.classList.remove("collapsed");
    rightSidebar.classList.add("expanded");
  } else {
    rightSidebar.classList.add("collapsed");
    rightSidebar.classList.remove("expanded");
  }
  setTimeout(updateCanvasScale, 310);
}

if (openInspectorToolbarBtn) openInspectorToolbarBtn.addEventListener("click", toggleInspector);
toggleTabBtn.addEventListener("click", toggleInspector);
closeInspectorBtn.addEventListener("click", () => toggleInspector(false));

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

/* --- Modals & Global HTML Insertion --- */
const htmlModal = document.getElementById("html-modal");
document.getElementById("open-html-modal-btn").addEventListener("click", () => htmlModal.classList.add("active"));
document.getElementById("close-modal-btn").addEventListener("click", () => htmlModal.classList.remove("active"));
htmlModal.addEventListener("click", e => { if (e.target === htmlModal) htmlModal.classList.remove("active"); });

document.getElementById("insert-html-btn").addEventListener("click", () => {
  const htmlString = document.getElementById("raw-html-input").value;
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
  if (typeof saveHistoryState === "function") saveHistoryState();
});

/* --- Export Code --- */
document.getElementById("export-btn").addEventListener("click", async () => {
  deselectElement(); 
  const clone = dropZone.cloneNode(true);
  
  if (clone.querySelector("#canvas-placeholder")) clone.querySelector("#canvas-placeholder").remove();
  if (clone.querySelector("#resize-handle")) clone.querySelector("#resize-handle").remove(); 

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
        const objLines = rules.map(rule => {
            const parts = rule.split(":");
            if (parts.length < 2) return "";
            const key = parts[0].trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            return key + ": '" + parts.slice(1).join(":").trim() + "'";
        }).filter(Boolean);
        return "style={{ " + objLines.join(", ") + " }}";
      });

    cleanCode = `export default function MyComponent() {\n  return (\n    <div className="relative w-full h-screen">\n      ${cleanCode.split("\n").join("\n      ")}\n    </div>\n  );\n}`;
  }

  try {
    await navigator.clipboard.writeText(cleanCode);
    const btn = document.getElementById("export-btn");
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-black"></i> Copied!`;
    btn.classList.replace("bg-studio-accent", "bg-white");
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.classList.replace("bg-white", "bg-studio-accent");
      lucide.createIcons();
    }, 2000);
  } catch (err) { alert("Failed to copy."); }
});