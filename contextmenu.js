// --- Custom Right-Click Context Menu Engine ---
const contextMenu = document.getElementById("custom-context-menu");

// Hide the context menu when clicking anywhere else
document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target)) {
    contextMenu.classList.add("hidden");
  }
});

// Trigger context menu inside the canvas area
dropZone.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // Stop default browser right-click menu
  
  // Select element underneath the mouse if applicable
  const el = e.target.closest(".canvas-element");
  if (el && el !== dropZone && el.id !== "canvas-placeholder") {
    selectElement(el);
  } else {
    deselectElement();
  }

  let x = e.clientX;
  let y = e.clientY;
  
  // Protect menu from opening off the right or bottom edges of the screen
  if (x + 200 > window.innerWidth) x -= 200;
  if (y + 250 > window.innerHeight) y -= 250;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove("hidden");
  
  // Refresh icons
  if (typeof lucide !== "undefined") lucide.createIcons();
});

// --- Menu Actions ---

document.getElementById("ctx-undo").addEventListener("click", () => {
  const undo = document.getElementById("undo-btn");
  if (undo && !undo.disabled) undo.click();
  contextMenu.classList.add("hidden");
});

document.getElementById("ctx-redo").addEventListener("click", () => {
  const redo = document.getElementById("redo-btn");
  if (redo && !redo.disabled) redo.click();
  contextMenu.classList.add("hidden");
});

document.getElementById("ctx-copy").addEventListener("click", () => {
  if (selectedElement) {
    const clone = selectedElement.cloneNode(true);
    
    // Offset the cloned element slightly so you can see it pasted
    const currentLeft = parseFloat(clone.style.left || 0);
    const currentTop = parseFloat(clone.style.top || 0);
    
    clone.style.left = `${currentLeft + 20}px`;
    clone.style.top = `${currentTop + 20}px`;
    
    dropZone.appendChild(clone);
    recursivelyMakeDraggable(clone);
    selectElement(clone);
    
    if (typeof saveHistoryState === "function") saveHistoryState();
  }
  contextMenu.classList.add("hidden");
});

document.getElementById("ctx-inspector").addEventListener("click", () => {
  const rightSidebar = document.getElementById("right-sidebar-wrapper");
  // Force open the inspector if it is hidden
  if (rightSidebar && rightSidebar.classList.contains("collapsed")) {
    document.getElementById("properties-toggle-tab").click();
  }
  contextMenu.classList.add("hidden");
});

document.getElementById("ctx-save").addEventListener("click", () => {
  // Cleans the canvas items to perfectly export them
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

  // Package the exact layout into a standalone HTML file
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Exported Design</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="w-screen h-screen overflow-hidden bg-white">
  <div style="position:relative; width:100%; height:100%;">
    ${clone.innerHTML.trim()}
  </div>
</body>
</html>`;

  // Create a blob and push the physical download trigger to Desktop/Downloads
  const blob = new Blob([htmlContent], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my-design.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  contextMenu.classList.add("hidden");
});

document.getElementById("ctx-delete").addEventListener("click", () => {
  const deleteBtn = document.getElementById("delete-el-btn");
  if (deleteBtn && selectedElement) deleteBtn.click();
  contextMenu.classList.add("hidden");
});