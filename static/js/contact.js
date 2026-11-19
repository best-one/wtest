/* Progressive enhancement for every [data-contact-form] on the page.
   Without JS the form POSTs natively and the Pages Function answers with a
   303 to /thank-you/. With JS we use fetch, then navigate to the same
   thank-you page so the catalog + WhatsApp QR are shown (matching WP).
   The ?ref= query parameter is carried into a hidden source field. */
(() => {
  const forms = document.querySelectorAll("form[data-contact-form]");
  if (!forms.length) return;

  const ref = new URLSearchParams(window.location.search).get("ref") || "";

  forms.forEach((form) => {
    const status = form.querySelector(".cf-status");
    const button = form.querySelector('button[type="submit"]');
    const label = button?.dataset.label || "Get Free Quote";
    const sourceInput = form.querySelector(".cf-source");
    const context = form.querySelector(".cf-context");
    const initialSource = (ref || form.dataset.sourceDefault || "").slice(0, 120);
    const errorDefault = form.dataset.error || "Your submission failed because of an error.";

    if (sourceInput) sourceInput.value = initialSource;
    if (ref && context) {
      const readable = ref.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      context.textContent = `Regarding: ${readable}`;
      context.classList.remove("hidden");
    }

    const setStatus = (text, ok) => {
      if (!status) return;
      status.textContent = text;
      status.className = `cf-status m-0 text-sm ${ok ? "text-green-700" : "text-red-600"}`;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }
      setStatus("", true);

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.ok !== true) {
          const e = data.error;
          const errText = e && (typeof e === "string" ? e : (e.message || e.code));
          setStatus(errText || errorDefault, false);
          if (window.turnstile) window.turnstile.reset();
          return;
        }

        window.location.assign("/thank-you/");
      } catch (err) {
        setStatus("Network error. Please check your connection and try again.", false);
        if (window.turnstile) window.turnstile.reset();
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = label;
        }
      }
    });
  });
})();
