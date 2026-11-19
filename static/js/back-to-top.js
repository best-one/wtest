/* Back-to-top button for every page.
   Self-contained: injects its own styles + markup so the same file works on
   both the static Elementor replicas and the Tailwind pages built from
   baseof.html. Sits above the bottom-right WhatsApp bubble when present. */
(function () {
  "use strict";
  if (document.getElementById("bl-back-to-top")) return;

  var css = document.createElement("style");
  css.textContent =
    "#bl-back-to-top{position:fixed;right:15px;bottom:81px;width:46px;height:46px;" +
    "display:flex;align-items:center;justify-content:center;padding:0;border:0;" +
    "border-radius:50%;background:#ff6347;color:#fff;cursor:pointer;z-index:99999998;" +
    "opacity:0;visibility:hidden;transform:translateY(8px);" +
    "transition:opacity .25s ease,transform .25s ease,visibility .25s ease,background-color .2s ease;" +
    "box-shadow:0 4px 12px rgba(34,35,52,.18);-webkit-tap-highlight-color:transparent}" +
    "#bl-back-to-top.is-visible{opacity:1;visibility:visible;transform:translateY(0)}" +
    "#bl-back-to-top:hover{background:#e5502f}" +
    "#bl-back-to-top:focus-visible{outline:2px solid #222334;outline-offset:2px}" +
    "#bl-back-to-top svg{width:20px;height:20px;display:block}" +
    "@media (prefers-reduced-motion:reduce){#bl-back-to-top{transition:none}" +
    "#bl-back-to-top.is-visible{transform:none}}";
  document.head.appendChild(css);

  var btn = document.createElement("button");
  btn.id = "bl-back-to-top";
  btn.type = "button";
  btn.setAttribute("aria-label", "Back to top");
  btn.title = "Back to top";
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);

  /* no WhatsApp bubble on this page (e.g. /products/, /about/, /faq/) */
  if (!document.getElementById("ht-ctc-chat")) btn.style.bottom = "15px";

  var reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function toggle() {
    /* Short pages (e.g. /thank-you/) can never scroll 400px, so cap the
       threshold at half of the real scrollable distance. */
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var threshold = Math.min(400, max * 0.5);
    if (max > 36 && window.pageYOffset > threshold) btn.classList.add("is-visible");
    else btn.classList.remove("is-visible");
  }

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
})();
