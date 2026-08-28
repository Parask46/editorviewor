/* --- Library: draggable component cards ---------------------------------- */
const libraryContainer = document.getElementById("library-container");

const libraryCategories = {
  "Basic Elements": [
    { icon: "heading", label: "Title", html: `<h1 style="font-size:48px;color:#000;margin:0;font-weight:700;">Heading</h1>` },
    { icon: "align-left", label: "Paragraph", html: `<p style="font-size:16px;color:#404040;margin:0;max-width:300px;line-height:1.5;">This is a paragraph.</p>` },
    { icon: "image", label: "Image Box", html: `<div style="width:200px;height:200px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;border-radius:8px;border:2px dashed #9ca3af;color:#6b7280;font-weight:600;" data-image-box="true">Image Box</div>` },
    { icon: "video", label: "Video", html: `<div style="width:320px;height:180px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;border-radius:8px;color:#fff;font-weight:600;"><i data-lucide="play-circle" style="width:48px;height:48px;opacity:.8;"></i></div>` },
    { icon: "mouse-pointer-2", label: "Button", html: `<button style="background:#2563eb;color:#fff;border:none;padding:12px 24px;border-radius:6px;font-weight:600;cursor:pointer;">Click Me</button>` }
  ],
  "Layout & Structure": [
    { icon: "box", label: "Container", html: `<div style="background:#fff;padding:20px;border:1px solid #ddd;border-radius:8px;width:250px;height:150px;box-shadow:0 4px 6px rgba(0,0,0,.05);"></div>` },
    { icon: "columns", label: "2 Columns", html: `<div style="display:flex;gap:20px;width:100%;padding:20px;background:#f9f9f9;box-sizing:border-box;"><div style="flex:1;background:#fff;padding:20px;border:1px dashed #ccc;">Column 1</div><div style="flex:1;background:#fff;padding:20px;border:1px dashed #ccc;">Column 2</div></div>` },
    { icon: "layout-grid", label: "3 Grid", html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;width:100%;padding:20px;background:#f9f9f9;box-sizing:border-box;"><div style="background:#fff;padding:20px;border:1px dashed #ccc;">Item 1</div><div style="background:#fff;padding:20px;border:1px dashed #ccc;">Item 2</div><div style="background:#fff;padding:20px;border:1px dashed #ccc;">Item 3</div></div>` }
  ],
  "Page Sections": [
    { icon: "menu", label: "Nav", html: `<nav style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 40px;background:#fff;border-bottom:1px solid #eaeaea;box-sizing:border-box;"><div style="font-weight:bold;font-size:24px;">Logo</div><div style="display:flex;gap:20px;font-size:14px;font-weight:500;"><span>Home</span><span>About</span><span>Contact</span></div></nav>` },
    { icon: "monitor", label: "Hero", html: `<section style="width:100%;min-height:400px;background:#2563eb;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;box-sizing:border-box;"><h1 style="font-size:48px;margin-bottom:20px;font-weight:700;">Welcome to Our Site</h1><p style="font-size:20px;max-width:600px;margin-bottom:30px;">A catchy subtitle to grab attention.</p><button style="background:#fff;color:#2563eb;padding:12px 24px;border:none;border-radius:4px;font-weight:bold;">Get Started</button></section>` },
    { icon: "layout-template", label: "Strip", html: `<div style="width:100%;min-height:250px;background:#f3f4f6;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;"><h2 style="margin:0;color:#111827;font-size:32px;font-weight:bold;">Full Width Strip</h2></div>` },
    { icon: "arrow-down-to-line", label: "Footer", html: `<footer style="width:100%;padding:40px;background:#111827;color:#9ca3af;display:flex;justify-content:space-between;align-items:center;box-sizing:border-box;"><div><h4 style="color:#fff;margin:0 0 5px 0;">Company Name</h4></div><div style="font-size:12px;">&copy; 2026 All rights reserved.</div></footer>` }
  ],
  "Forms & Inputs": [
    { icon: "type", label: "Input", html: `<input type="text" placeholder="Enter text here..." style="padding:10px 15px;border:1px solid #ccc;border-radius:4px;width:250px;font-size:14px;">` },
    { icon: "align-justify", label: "Textarea", html: `<textarea placeholder="Type your message..." style="padding:10px 15px;border:1px solid #ccc;border-radius:4px;width:300px;height:100px;font-size:14px;font-family:sans-serif;resize:none;"></textarea>` },
    { icon: "file-text", label: "Form", html: `<form style="background:#fff;padding:30px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.1);border:1px solid #eaeaea;display:flex;flex-direction:column;gap:15px;width:350px;box-sizing:border-box;"><h3 style="margin:0 0 10px 0;font-size:20px;">Contact Us</h3><input type="text" placeholder="Your Name" style="padding:10px;border:1px solid #ccc;border-radius:4px;width:100%;box-sizing:border-box;"><button type="button" style="background:#000;color:#fff;border:none;padding:12px;border-radius:4px;cursor:pointer;font-weight:600;width:100%;">Submit Form</button></form>` }
  ]
};

libraryContainer.innerHTML = "";
Object.keys(libraryCategories).forEach(categoryName => {
  const header = document.createElement("div");
  header.className = "prop-label mb-2 text-white border-b border-studio-border pb-1 mt-2 first:mt-0";
  header.innerText = categoryName;
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-3 gap-2 mb-4";

  libraryCategories[categoryName].forEach(item => {
    const card = document.createElement("div");
    card.className = "library-card group";
    card.draggable = true;
    card.dataset.html = item.html;
    card.innerHTML = `
      <div class="text-studio-muted group-hover:text-studio-accent transition-colors"><i data-lucide="${item.icon}" class="w-6 h-6"></i></div>
      <span class="text-[9px] font-medium text-studio-muted group-hover:text-studio-text transition-colors mt-1">${item.label}</span>`;
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", card.dataset.html);
      e.dataTransfer.setData("source", "library");
      e.dataTransfer.effectAllowed = "copy";
      card.classList.add("opacity-50", "border-studio-accent");
    });
    card.addEventListener("dragend", () => card.classList.remove("opacity-50", "border-studio-accent"));
    grid.appendChild(card);
  });
  libraryContainer.appendChild(header);
  libraryContainer.appendChild(grid);
});
lucide.createIcons();
