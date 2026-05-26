/* ============================================================
   AI Generator Tool – production logic
   - Requires authenticated user (Firebase)
   - Real voice generation (StreamElements + Google TTS fallback)
   - Real credit tracking (Firestore)
   - Saves generations to user history
   ============================================================ */

import { requireAuth }          from "./auth.js";
import { VOICES, findVoice, playVoiceInto, downloadVoice } from "./voice-service.js";
import {
  getUserProfile, useOneCredit, addCredits,
  saveGeneration
} from "./user-service.js";

const $ = (s) => document.querySelector(s);

let currentUser = null;
let currentText = "";
let currentVoiceId = "Joanna";

(async () => {
  currentUser = await requireAuth("login.html");
  await populateVoices();
  await refreshCreditDisplay();
  bindUI();
})();

async function populateVoices() {
  const sel = $("#voice-select");
  if (!sel) return;
  const byAccent = {};
  VOICES.forEach(v => { (byAccent[v.accent] = byAccent[v.accent] || []).push(v); });
  sel.innerHTML = Object.entries(byAccent).map(([accent, list]) => `
    <optgroup label="${accent}">
      ${list.map(v => `<option value="${v.id}">${v.name} — ${v.desc} (${v.gender})</option>`).join("")}
    </optgroup>
  `).join("");
  sel.value = currentVoiceId;
  sel.addEventListener("change", () => currentVoiceId = sel.value);
}

async function refreshCreditDisplay() {
  const profile = await getUserProfile();
  const el = $("#credit-count");
  if (el) el.textContent = profile?.plan === "pro" ? "∞" : (profile?.credits ?? 0);
  const planEl = $("#current-plan");
  if (planEl) planEl.textContent = profile?.plan?.toUpperCase() || "FREE";
}

function bindUI() {
  const textInput   = $("#text-input");
  const charCount   = $("#char-count");
  const generateBtn = $("#generate-btn");
  const clearBtn    = $("#clear-btn");
  const pasteBtn    = $("#paste-btn");
  const regenBtn    = $("#regen-btn");
  const downloadBtn = $("#download-btn");
  const saveBtn     = $("#save-btn");
  const watchAdBtn  = $("#watch-ad-btn");
  const resultBox   = $("#result-box");
  const audioEl     = $("#result-audio");
  const statusEl    = $("#status-message");

  const setStatus = (message) => {
    if (statusEl) statusEl.textContent = message;
  };

  textInput.addEventListener("input", () => charCount.textContent = textInput.value.length);
  clearBtn.addEventListener("click", () => { textInput.value = ""; charCount.textContent = 0; });

  pasteBtn.addEventListener("click", async () => {
    try {
      const t = await navigator.clipboard.readText();
      textInput.value += t;
      charCount.textContent = textInput.value.length;
      toast("📋 Pasted");
    } catch { toast("Clipboard access denied"); }
  });

  async function doGenerate() {
    const text = textInput.value.trim();
    if (!text) return toast("Please enter some text first");

    const profile = await getUserProfile() || { plan: "free", credits: 0 };
    if (profile.plan !== "pro" && (profile.credits ?? 0) <= 0) {
      $("#reward-modal").classList.add("open");
      return;
    }

    const ok = await useOneCredit();
    if (!ok) { $("#reward-modal").classList.add("open"); return; }

    generateBtn.disabled = true;
    generateBtn.textContent = "⏳ Generating...";
    setStatus("Generating AI voice, please wait...");
    resultBox.classList.remove("hidden");

    try {
      currentText = text;
      await playVoiceInto(audioEl, text, currentVoiceId);
      toast("✅ Voice generated!");
      setStatus("Generation complete. Press play to listen.");
      saveGeneration({
        text,
        voice: findVoice(currentVoiceId).name,
        voiceId: currentVoiceId
      }).catch(()=>{});
    } catch (e) {
      console.error("Generation error:", e);
      toast("Generation failed: " + e.message);
      setStatus("Generation failed. See console for details.");
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = "🎙 Generate Voice";
      refreshCreditDisplay();
    }
  }

  generateBtn.addEventListener("click", doGenerate);
  regenBtn?.addEventListener("click", doGenerate);

  downloadBtn?.addEventListener("click", async () => {
    if (!currentText) return toast("Generate something first");
    try {
      await downloadVoice(currentText, currentVoiceId);
      toast("⬇ Download started");
    } catch (e) {
      toast(e.message);
    }
  });

  saveBtn?.addEventListener("click", async () => {
    if (!currentText) return toast("Generate something first");
    await saveGeneration({
      text: currentText,
      voice: findVoice(currentVoiceId).name,
      voiceId: currentVoiceId
    });
    toast("⭐ Saved to history");
  });

  // Rewarded ad flow (simulation — swap with real SDK in production)
  watchAdBtn?.addEventListener("click", () => {
    $("#reward-modal").classList.remove("open");
    $("#ad-modal").classList.add("open");
    let secs = 5;
    const cd = $("#ad-countdown");
    cd.textContent = secs;
    const t = setInterval(async () => {
      secs--;
      cd.textContent = secs;
      if (secs <= 0) {
        clearInterval(t);
        $("#ad-modal").classList.remove("open");
        await addCredits(3);
        refreshCreditDisplay();
        toast("🎉 +3 credits unlocked!");
      }
    }, 1000);
  });

  // Range sliders display
  ["rate","pitch"].forEach(key => {
    const r = $("#"+key);
    const v = $("#"+key+"-val");
    if (r && v) r.addEventListener("input", () => {
      v.textContent = r.value + (key==="rate" ? "x" : "");
      if (key === "rate" && audioEl) audioEl.playbackRate = parseFloat(r.value);
    });
  });
}
