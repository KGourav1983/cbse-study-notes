/* =========================================================================
   feedback.js — sends the feedback form to the site owner's email via
   Web3Forms (https://web3forms.com), a free service built for exactly this:
   static sites with no backend. It emails every submission to whatever
   address the access key is registered to. Nothing is stored on this site.

   ONE-TIME SETUP (do this before the form will work):
   1. Go to https://web3forms.com and enter the email address you want
      feedback sent to. No account or password needed.
   2. You'll get an "Access Key" (a short string) — check your inbox.
   3. Paste it below in place of "REPLACE_WITH_YOUR_WEB3FORMS_ACCESS_KEY".
   4. Deploy. Submit the form once yourself to confirm the email arrives.
   That's the whole setup — free tier covers generous monthly submissions.
   ========================================================================= */

const Feedback = (() => {
  const ACCESS_KEY = "b6950631-ad62-490e-80cf-30800d0b3717";
  const ENDPOINT = "https://api.web3forms.com/submit";

  function setStatus(el, kind, message) {
    el.hidden = false;
    el.className = "feedback-status " + kind;
    el.textContent = message;
  }

  function mount(formEl) {
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusEl = document.getElementById("feedback-status");
      const submitBtn = formEl.querySelector("#feedback-submit");

      // Honeypot: a field real users never see or fill in. If it has a
      // value, a bot filled it in — silently drop the submission.
      if (formEl.querySelector("#feedback-hp").value) return;

      if (!ACCESS_KEY || ACCESS_KEY.startsWith("REPLACE_WITH")) {
        setStatus(
          statusEl,
          "error",
          "This form isn't fully set up yet — the site owner still needs to add a Web3Forms access key. Nothing was sent."
        );
        return;
      }

      const message = formEl.querySelector("#feedback-message").value.trim();
      if (!message) {
        setStatus(statusEl, "error", "Please write a message before sending.");
        return;
      }

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = "Sending…";
      statusEl.hidden = true;

      const payload = {
        access_key: ACCESS_KEY,
        subject: "New feedback — CBSE Prep",
        from_name: "CBSE Prep feedback form",
        category: formEl.querySelector("#feedback-category").value,
        name: formEl.querySelector("#feedback-name").value.trim() || "Not provided",
        email: formEl.querySelector("#feedback-email").value.trim() || "Not provided",
        message,
        page: window.location.href,
      };

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
          formEl.hidden = true;
          setStatus(
            statusEl,
            "success",
            "Thanks — your feedback has been sent. We read every message."
          );
        } else {
          throw new Error(data.message || "Unknown error");
        }
      } catch (err) {
        console.error("Feedback submission failed:", err);
        setStatus(
          statusEl,
          "error",
          "Something went wrong sending your feedback. Please try again in a moment."
        );
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }

  return { mount };
})();
