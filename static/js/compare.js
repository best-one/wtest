/* Before / After 图片拖动对比。
 * 复刻原站 ElementsKit image-comparison（twentytwenty）的交互，去掉 jQuery 依赖：
 *  - 拖动手柄或点击/触摸组件任意位置移动分隔线
 *  - hover 时显示 Before / After 标签（CSS 负责），拖动中隐藏
 *  - 键盘：←/→、Home/End、PageUp/PageDown，带 aria-valuenow
 *  - 默认位置由 data-offset 指定（原站 50）
 */
(() => {
  "use strict";

  const clamp = (n) => Math.max(0, Math.min(100, n));

  function setup(container) {
    const handle = container.querySelector(".twentytwenty-handle");
    if (!handle) return;

    const beforeLabel = container.dataset.beforeLabel || "Before";
    const initial = clamp(parseFloat(container.dataset.offset || "50") || 50);
    let pos = initial;
    let dragging = false;

    const set = (value) => {
      pos = clamp(value);
      const rounded = Math.round(pos);
      container.style.setProperty("--tt-pos", pos + "%");
      handle.setAttribute("aria-valuenow", String(rounded));
      handle.setAttribute("aria-valuetext", rounded + "% " + beforeLabel);
    };

    const percentFromEvent = (event) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width) return pos;
      return ((event.clientX - rect.left) / rect.width) * 100;
    };

    const stop = (event) => {
      if (!dragging) return;
      dragging = false;
      container.classList.remove("twentytwenty-active");
      if (event && event.pointerId != null && container.hasPointerCapture?.(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
    };

    container.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      dragging = true;
      container.classList.add("twentytwenty-active");
      // 捕获指针，手指/鼠标移出组件后仍可继续拖动
      try { container.setPointerCapture(event.pointerId); } catch (_) { /* noop */ }
      set(percentFromEvent(event));
      handle.focus({ preventScroll: true });
      event.preventDefault();
    });

    container.addEventListener("pointermove", (event) => {
      if (dragging) set(percentFromEvent(event));
    });
    container.addEventListener("pointerup", stop);
    container.addEventListener("pointercancel", stop);
    window.addEventListener("blur", () => stop());

    handle.addEventListener("keydown", (event) => {
      let next = null;
      switch (event.key) {
        case "ArrowLeft": case "ArrowDown": next = pos - 1; break;
        case "ArrowRight": case "ArrowUp": next = pos + 1; break;
        case "PageDown": next = pos - 10; break;
        case "PageUp": next = pos + 10; break;
        case "Home": next = 0; break;
        case "End": next = 100; break;
        default: return;
      }
      event.preventDefault();
      set(next);
    });

    set(initial);
  }

  const init = () => document.querySelectorAll("[data-image-compare]").forEach(setup);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
