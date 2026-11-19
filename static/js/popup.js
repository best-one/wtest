/* 原站 Elementor Popup #901：Quick Quote 浮层。
 * 备份中的显示条件是「除 /thank-you/ 外全站显示」，由 Hugo 模板控制是否输出。
 * 为避免打断浏览，首次访问延迟出现；关闭后写入 localStorage，30 天内不再出现。
 */
(() => {
  "use strict";

  const KEY = "bl-quote-popup-dismissed";
  const DELAY = 12000;
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

  const init = () => {
    const popup = document.querySelector("[data-quote-popup]");
    if (!popup) return;

    let dismissed = false;
    try {
      const stamp = Number(localStorage.getItem(KEY) || 0);
      dismissed = Boolean(stamp && Date.now() - stamp < MAX_AGE);
    } catch (_) { /* localStorage 不可用时按未关闭处理 */ }

    if (dismissed) {
      popup.remove();
      return;
    }

    const dismiss = () => {
      popup.hidden = true;
      try { localStorage.setItem(KEY, String(Date.now())); } catch (_) { /* noop */ }
      window.removeEventListener("keydown", onKey);
    };
    const onKey = (event) => { if (event.key === "Escape" && !popup.hidden) dismiss(); };

    popup.querySelectorAll("[data-quote-popup-close]").forEach((button) => {
      button.addEventListener("click", dismiss);
    });
    window.addEventListener("keydown", onKey);

    // 表单提交跳转前的浮层不应继续显示；同页 AJAX 提交则保持
    setTimeout(() => { if (popup.isConnected) popup.hidden = false; }, DELAY);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
