/* ============================================================
   VoxAI – Global Scripts (loaded on every page)
   ============================================================ */

import { onAuth, logOut } from "./auth.js";
import { playVoiceInto } from "./voice-service.js";

document.addEventListener("DOMContentLoaded", () => {
  // ---- Mobile nav toggle ----
  const toggle = document.querySelector(".mobile-toggle");
  const links  = document.querySelector(".nav-links");
  if (toggle && links) toggle.addEventListener("click", () => links.classList.toggle("open"));

  // ---- FAQ accordion ----
  document.querySelectorAll(".faq-item").forEach(item => {
    const q = item.querySelector(".faq-question");
    if (q) q.addEventListener("click", () => item.classList.toggle("active"));
  });

  // ---- Filter tabs (voice library) ----
  document.querySelectorAll(".tabs").forEach(group => {
    group.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        group.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const filter = tab.dataset.filter;
        document.querySelectorAll("[data-category]").forEach(card => {
          card.style.display = (!filter || filter === "all" || card.dataset.category === filter) ? "" : "none";
        });
      });
    });
  });

  // ---- Voice preview buttons (real audio, auto-fallback) ----
  // Reuses one shared <audio> element so playing a new preview stops the old one
  let sharedAudio = null;
  document.querySelectorAll(".play-btn[data-voice-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const voiceId = btn.dataset.voiceId;
      const text    = btn.dataset.sample || "Hello! This is a preview of an AI generated voice.";
      const original = btn.innerHTML;
      btn.innerHTML = "⏳";
      btn.disabled = true;
      try {
        if (!sharedAudio) { sharedAudio = new Audio(); sharedAudio.crossOrigin = "anonymous"; }
        sharedAudio.pause();
        await playVoiceInto(sharedAudio, text, voiceId);
        toast("▶ Playing " + voiceId);
      } catch (e) {
        console.error(e);
        toast("Preview failed: " + e.message);
      } finally {
        btn.innerHTML = original;
        btn.disabled = false;
      }
    });
  });

  // ---- Auth-aware navbar ----
  initAuthNav();

  // ---- Logout buttons ----
  document.querySelectorAll("[data-action='logout']").forEach(b => {
    b.addEventListener("click", e => { e.preventDefault(); logOut(); });
  });
});

function initAuthNav() {
  const navCta = document.querySelector(".nav-cta");
  if (!navCta) return;
  const loggedOutHTML = navCta.innerHTML;

  onAuth(user => {
    if (user) {
      const name = user.displayName || user.email.split("@")[0];
      const initial = name.charAt(0).toUpperCase();
      navCta.innerHTML = `
        <a href="dashboard.html" class="btn btn-ghost" style="display:flex;align-items:center;gap:8px;">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--gradient);display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">${initial}</span>
          ${name}
        </a>
        <a href="#" data-action="logout" class="btn btn-secondary">Logout</a>
      `;
      navCta.querySelector("[data-action='logout']")
        .addEventListener("click", e => { e.preventDefault(); logOut(); });
    } else {
      navCta.innerHTML = loggedOutHTML;
    }
  });
}

window.toast = function(message) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
};
function toast(m){ window.toast(m); }
