/* Interaction layer for the pixel replica of laserconsums.com.
   Uses the site's own jQuery + twentytwenty libraries for the Before/After slider,
   and small vanilla handlers for the FAQ toggle, popup and inquiry forms. */
(function () {
  "use strict";

  var doc = document;
  var $ = window.jQuery;

  /* ------------------------------------------------ Before / After comparison
     Mirrors elementskit image-comparison.js: read the widget's data-* options,
     let jquery.twentytwenty.js build handle/overlay/labels, then add a11y. */
  if ($ && $.fn.twentytwenty) {
    $(function () {
      $(".elementskit-image-comparison").each(function () {
        var $c = $(this);
        var d = $c.data() || {};
        if ($c.hasClass("twentytwenty-container") || $c.find("img").length < 2) return;

        var pct = parseFloat(d.offset);
        if (isNaN(pct)) pct = 0.5;
        var vertical = $c.hasClass("image-comparison-container-vertical");
        var opts = {
          default_offset_pct: pct,
          orientation: vertical ? "vertical" : "horizontal",
          before_label: d.label_before || "Before",
          after_label: d.label_after || "After",
          no_overlay: Boolean(d.overlay),
          move_slider_on_hover: Boolean(d.move_slider_on_hover),
          click_to_move: Boolean(d.click_to_move),
          move_with_handle_only: true
        };

        // Seraphinite cached a pre-rendered handle in the HTML; drop it so the
        // plugin creates exactly one handle/overlay pair.
        $c.find(".twentytwenty-handle, .twentytwenty-overlay").remove();

        $c.twentytwenty(opts);

        var $handle = $c.find(".twentytwenty-handle");
        var $before = $c.find("img.twentytwenty-before");
        $handle.attr({
          role: "slider",
          tabindex: "0",
          "aria-label": d.a11y_label || "Image comparison slider",
          "aria-orientation": opts.orientation,
          "aria-valuemin": "0",
          "aria-valuemax": "100"
        });

        function sync() {
          var size = vertical ? $before.height() : $before.width();
          var pos = parseFloat($handle.css(vertical ? "top" : "left"));
          if (size > 0 && !isNaN(pos)) {
            var v = Math.round(Math.max(0, Math.min(1, pos / size)) * 100);
            $handle.attr("aria-valuenow", v);
            $handle.attr("aria-valuetext", v + "% " + opts.before_label);
          }
        }
        $c.on("move mousemove click resize", sync);
        sync();
      });
    });
  }

  /* ------------------------------------------------ FAQ toggle (Elementor) */
  Array.prototype.forEach.call(doc.querySelectorAll(".elementor-toggle-item"), function (item) {
    var title = item.querySelector(".elementor-tab-title");
    var content = item.querySelector(".elementor-tab-content");
    if (!title || !content) return;
    title.addEventListener("click", function (e) {
      e.preventDefault();
      var open = title.getAttribute("aria-expanded") === "true";
      title.setAttribute("aria-expanded", String(!open));
      title.classList.toggle("elementor-active", !open);
      content.style.display = open ? "none" : "block";
    });
  });

  /* ------------------------------------------------ Quick Quote popup (#901) */
  var modal = doc.getElementById("elementor-popup-modal-901");
  if (modal) {
    var KEY = "bl-quote-popup-dismissed";
    var timer = null;
    var dismissed = false;
    try {
      var stamp = parseInt(localStorage.getItem(KEY) || "0", 10);
      dismissed = Date.now() - stamp < 30 * 24 * 60 * 60 * 1000;
    } catch (e) { /* storage unavailable */ }

    function remember() {
      try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
    }
    function show() {
      clearTimeout(timer);
      modal.hidden = false;
      doc.body.style.overflow = "hidden";
    }
    function hide(shouldRemember) {
      modal.hidden = true;
      doc.body.style.overflow = "";
      if (shouldRemember) remember();
    }

    if (!dismissed && !/^\/thank-you\/?$/.test(location.pathname)) {
      timer = setTimeout(show, 12000);
    }
    Array.prototype.forEach.call(doc.querySelectorAll("[data-open-popup]"), function (btn) {
      btn.addEventListener("click", function (e) { e.preventDefault(); show(); });
    });
    var close = modal.querySelector(".dialog-close-button");
    if (close) close.addEventListener("click", function () { hide(true); });
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.classList.contains("elementor-popup-modal")) hide(true);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) hide(true);
    });
  }

  /* ------------------------------------------------ Turnstile (production only) */
  var tk = doc.querySelector('meta[name="turnstile-site-key"]');
  var sitekey = tk ? (tk.getAttribute("content") || "").trim() : "";
  if (sitekey) {
    var s = doc.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = function () {
      if (!window.turnstile) return;
      Array.prototype.forEach.call(doc.querySelectorAll("form[data-contact-form]"), function (form) {
        var holder = doc.createElement("div");
        holder.className = "cf-turnstile";
        var submit = form.querySelector('[type="submit"]');
        // 必须插在按钮所在的父节点里；submit.parentNode 通常不是 form 的直接子节点，
        // 直接 form.insertBefore(holder, submit.parentNode) 会抛 NotFoundError。
        var anchor = submit && submit.parentNode;
        if (anchor) {
          anchor.insertBefore(holder, submit);
        } else {
          form.appendChild(holder);
        }
        try {
          window.turnstile.render(holder, { sitekey: sitekey, "response-field-name": "cf-turnstile-response" });
        } catch (e) {}
      });
    };
    doc.head.appendChild(s);
  }

  /* ------------------------------------------------ Inquiry forms */
  Array.prototype.forEach.call(doc.querySelectorAll("form[data-contact-form]"), function (form) {
    var msg = form.querySelector('.elementor-message[role="status"]');
    var btn = form.querySelector('[type="submit"]');
    var source = form.querySelector('input[name="source"]');
    if (source) {
      var ref = new URLSearchParams(location.search).get("ref");
      if (ref) source.value = ref;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (msg) msg.hidden = true;
      if (btn) btn.disabled = true;
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (res.ok && res.data.ok) {
            location.href = form.getAttribute("data-success") || "/thank-you/";
            return;
          }
          if (msg) {
            msg.hidden = false;
            msg.className = "elementor-message elementor-message-danger";
            var e = res.data && res.data.error;
          var errText = e && (typeof e === "string" ? e : (e.message || e.code));
          msg.textContent = errText || "Please provide a valid name, email and message";
          }
          if (btn) btn.disabled = false;
        })
        .catch(function () {
          if (msg) {
            msg.hidden = false;
            msg.className = "elementor-message elementor-message-danger";
            msg.textContent = "Submission failed. Please try again.";
          }
          if (btn) btn.disabled = false;
        });
    });
  });

  /* ------------------------------------------------ Click-to-Chat (WhatsApp)
     The original HoliThemes plugin reads .ht_ctc_chat_data at runtime and opens
     https://wa.me/<number> with target _blank. Its JS was not carried over into
     the static build, so lay a real, transparent link over the button. */
  (function () {
    var box = doc.getElementById("ht-ctc-chat");
    if (!box || box.querySelector('a[href^="https://wa.me/"]')) return;
    if (window.getComputedStyle(box).position === "static") box.style.position = "relative";
    var link = doc.createElement("a");
    link.href = "https://wa.me/601123342407";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "WhatsApp us");
    link.style.cssText = "position:absolute;inset:0;display:block;z-index:1;";
    box.style.cursor = "pointer";
    box.style.zIndex = "99999999";
    box.appendChild(link);
  })();
})();
