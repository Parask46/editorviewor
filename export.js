/* --- Clean Serializer & Modular Export Engine ----------------------------
   Walks shadowRootInner, strips editor metadata, preserves onclick and
   other interactive attributes, extracts inline styles into a separate
   stylesheet, and emits a standalone index.html + style.css bundle.
--------------------------------------------------------------------------- */

const EDITOR_CLASSES = new Set(["canvas-element","is-selected","is-dragging","is-contenteditable"]);
const EDITOR_ATTRS = ["draggable","data-tag","contenteditable"];

function cleanClone(root) {
  const clone = root.cloneNode(true);
  // Walk with a TreeWalker so we don't depend on cloneNode preserving ShadowRoot
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
  const all = [];
  let n; while ((n = walker.nextNode())) all.push(n);
  all.forEach(el => {
    [...el.classList].forEach(c => { if (EDITOR_CLASSES.has(c)) el.classList.remove(c); });
    EDITOR_ATTRS.forEach(a => el.removeAttribute(a));
    if (el.attributes && el.attributes.length === 0) el.removeAttribute("class");
  });
  // Strip the tree-marker comments if any
  return clone;
}

function extractStyles(root) {
  // Map inline style="..." -> class selector tree. We do a simple "by element
  // identity" approach: walk the live DOM, record each element's selector
  // (nth-of-type path) + style text. Then re-apply during serialization.
  const liveNodes = Array.from(root.querySelectorAll("*"));
  const cloneNodes = Array.from(root.cloneNode(true).querySelectorAll("*"));
  const rules = [];
  liveNodes.forEach((el, i) => {
    if (!el.style || !el.style.cssText) return;
    const c = cloneNodes[i];
    if (!c) return;
    c.setAttribute("style", el.style.cssText);
    rules.push({ selector: buildSelector(el), css: el.style.cssText });
  });
  return rules;
}

function buildSelector(el) {
  const parts = [];
  let cur = el;
  while (cur && cur.parentNode) {
    const parent = cur.parentNode;
    const idx = Array.prototype.indexOf.call(parent.children, cur);
    parts.unshift(`${cur.tagName.toLowerCase()}:nth-of-type(${idx + 1})`);
    cur = parent;
  }
  return parts.join(" > ");
}

function buildHTML(root) {
  const cleaned = cleanClone(root);
  // Convert any remaining class names to escaped HTML
  return cleaned.innerHTML.trim();
}

function buildCSS(rules) {
  return rules.map(r => `${r.selector} { ${r.css} }`).join("\n");
}

function exportStandalone() {
  if (!shadowRootInner.children.length) { alert("Canvas is empty!"); return; }
  const html = buildHTML(shadowRootInner);
  const css  = buildCSS(extractStyles(shadowRootInner));
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Design</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="stage">
    ${html}
  </div>
</body>
</html>`;
  const fullCSS = `body { margin: 0; font-family: 'General Sans', system-ui, sans-serif; }
.stage { position: relative; width: 1200px; height: 800px; background: #fff; overflow: hidden; }
.stage * { box-sizing: border-box; }
${css}`;
  downloadFiles({ "index.html": fullHTML, "style.css": fullCSS });
}

function exportReact() {
  if (!shadowRootInner.children.length) { alert("Canvas is empty!"); return; }
  const html = buildHTML(shadowRootInner)
    .replace(/class=/g, "className=")
    .replace(/<br>/gi, "<br />")
    .replace(/<hr>/gi, "<hr />")
    .replace(/<img([^>]+)>/g, "<img$1 />")
    .replace(/<input([^>]+)>/gi, "<input$1 />")
    .replace(/style="([^"]*)"/g, (_, s) => {
      const rules = s.split(";").filter(r => r.trim()).map(r => {
        const [k, ...rest] = r.split(":");
        if (!k || !rest.length) return null;
        const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return `${key}: "${rest.join(":").trim()}"`;
      }).filter(Boolean);
      return `style={{ ${rules.join(", ")} }}`;
    });
  const code = `export default function MyComponent() {\n  return (\n    <div className="stage">\n      ${html.split("\n").join("\n      ")}\n    </div>\n  );\n}`;
  navigator.clipboard.writeText(code).then(() => toast("Copied React JSX!"));
}

function downloadFiles(files) {
  // Single-file mode: package index.html with inline <style>. Keeps drag-drop
  // import simple and avoids CORS when opening the file directly.
  const html = Object.values(files)[0];
  const inline = html.replace("</head>", `<style>${buildCSS(extractStyles(shadowRootInner))}</style>\n</head>`);
  const blob = new Blob([inline], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "orbital-export.html";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#E2FD70;color:#000;padding:10px 16px;border-radius:8px;font-weight:600;z-index:99999;";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

window.exportStandalone = exportStandalone;
window.exportReact = exportReact;
