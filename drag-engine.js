/* --- Unified PointerEvent Drag Engine -------------------------------------
   Single code path for both library drops and existing-element drags:
   - pointerdown  captures the element + offset, stores baseline coords
   - pointermove  applies transform: translate(dx, dy) for 60fps movement
   - pointerup    commits final style.left/top, runs AABB nudge, snaps to
                  a container if the cursor is over one, and saves history
                  exactly once.
   Coordinate math always divides by currentScale so nested parent bounds
   are subtracted correctly under any zoom.
--------------------------------------------------------------------------- */

const DragEngine = (() => {
  let active = null;

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = e.target.closest && e.target.closest(".canvas-element");
    if (!el || el.isContentEditable) return;
    if (e.target.closest && e.target.closest(".resize-handle")) return; // resize owns these

    e.preventDefault();
    e.stopPropagation();

    const rect = el.getBoundingClientRect();
    const parent = el.parentNode === shadowRootInner ? shadowRootInner : el.parentNode;
    const parentRect = parent.getBoundingClientRect();
    const baseLeft = (rect.left - parentRect.left) / currentScale;
    const baseTop  = (rect.top  - parentRect.top)  / currentScale;
    const offsetX  = (e.clientX - rect.left) / currentScale;
    const offsetY  = (e.clientY - rect.top)  / currentScale;

    active = { el, parent, baseLeft, baseTop, offsetX, offsetY, pointerId: e.pointerId, moved: false };
    el.classList.add("is-dragging");
    if (typeof resizeHide === "function") resizeHide();
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
  }

  function onPointerMove(e) {
    if (!active || e.pointerId !== active.pointerId) return;
    e.preventDefault();
    const { x, y } = clientToCanvas(e.clientX, e.clientY);
    const dx = (x - active.offsetX) - active.baseLeft;
    const dy = (y - active.offsetY) - active.baseTop;
    active.el.style.transform = `translate(${dx}px, ${dy}px)`;
    active.moved = true;
  }

  function onPointerUp(e) {
    if (!active || e.pointerId !== active.pointerId) return;
    const { el, baseLeft, baseTop, moved } = active;
    const finished = active;
    active = null;

    el.classList.remove("is-dragging");
    try { el.releasePointerCapture(finished.pointerId); } catch (_) {}

    if (!moved) {
      el.style.transform = "";
      return;
    }

    // Commit the visual transform to absolute left/top.
    let nextX = baseLeft, nextY = baseTop;
    const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform || "");
    if (m) { nextX = baseLeft + parseFloat(m[1]); nextY = baseTop + parseFloat(m[2]); }
    el.style.transform = "";
    el.style.left = `${nextX}px`;
    el.style.top  = `${nextY}px`;

    // If released over a different valid container, re-home the element.
    const container = findContainerAtPoint(e.clientX, e.clientY);
    if (container && container !== el && !el.contains(container) && el.parentNode !== container) {
      nestIntoContainer(el, container, e.clientX, e.clientY);
    } else {
      // Snap away from any full overlap.
      findNonOverlappingPosition(el, nextX, nextY);
    }

    if (typeof resizeShow === "function") resizeShow(el);
    if (typeof renderDOMTree === "function") renderDOMTree();
    if (typeof saveHistoryState === "function") saveHistoryState();
  }

  /* Library drops still use the HTML5 DnD API for the *card itself* (the
     cards live outside the canvas), but the actual insertion runs through
     the same finalize path so the unified pipeline applies. */
  dropZone.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    if (placeholder) placeholder.style.display = "none";
    if (e.dataTransfer.getData("source") !== "library") return;
    const html = e.dataTransfer.getData("text/plain");
    if (!html) return;

    const temp = document.createElement("div");
    temp.innerHTML = html.trim();
    const newEl = temp.firstElementChild;
    if (!newEl) return;
    finalizeInsert(newEl, e.clientX, e.clientY);
  });

  function finalizeInsert(el, clientX, clientY) {
    recursivelyMakeDraggable(el);
    el.style.position = "absolute";
    el.style.margin = "0";

    // Probe for a container at the drop point.
    const container = findContainerAtPoint(clientX, clientY);
    let dropX, dropY;
    if (container) {
      const c = clientToContainer(container, clientX, clientY);
      if (window.getComputedStyle(container).position === "static") container.style.position = "relative";
      container.appendChild(el);
      dropX = c.x; dropY = c.y;
    } else {
      const c = clientToCanvas(clientX, clientY);
      shadowRootInner.appendChild(el);
      dropX = c.x - 20; dropY = c.y - 20;
    }
    el.style.left = `${dropX}px`;
    el.style.top  = `${dropY}px`;
    assignSmartZIndex(el);
    recursivelyMakeDraggable(el);
    findNonOverlappingPosition(el, dropX, dropY);
    selectElement(el);
    if (typeof renderDOMTree === "function") renderDOMTree();
    if (typeof saveHistoryState === "function") saveHistoryState();
  }

  // Wire up
  shadowRootInner.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup",   onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  return { finalizeInsert };
})();
