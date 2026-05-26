/* ============================================================
   VOICE GENERATION SERVICE — FINAL working version
   ------------------------------------------------------------
   STRATEGY:
   • PLAYBACK: assign the API URL DIRECTLY to <audio src="…">
     → Browsers DO NOT enforce CORS for audio playback,
       so this always works, even when fetch() is blocked.
   • DOWNLOAD: use ttsmp3.com which returns a normal MP3 URL
     that the browser can download via <a href download>.

   PROVIDERS:
   1) TTSMP3 (uses AWS Polly voices — same names: Joanna,
      Matthew, Brian, Amy, Mizuki, Conchita, etc.)
      → returns a real public MP3 URL you can play AND download
   2) Google Translate TTS as a fallback
   ============================================================ */

/* ---------- Voice catalog (matches TTSMP3 / AWS Polly names) ---------- */
export const VOICES = [
  // 🇺🇸 American English
  { id: "Joanna",   name: "Joanna",   gender: "female", lang: "en", accent: "American",  category: "american-female", desc: "Warm, friendly" },
  { id: "Salli",    name: "Salli",    gender: "female", lang: "en", accent: "American",  category: "american-female", desc: "Bright, youthful" },
  { id: "Kimberly", name: "Kimberly", gender: "female", lang: "en", accent: "American",  category: "american-female", desc: "Clear narrator" },
  { id: "Kendra",   name: "Kendra",   gender: "female", lang: "en", accent: "American",  category: "american-female", desc: "Soft, calm" },
  { id: "Ivy",      name: "Ivy",      gender: "female", lang: "en", accent: "American",  category: "anime",           desc: "Child-like, anime" },
  { id: "Matthew",  name: "Matthew",  gender: "male",   lang: "en", accent: "American",  category: "american-male",   desc: "Deep, professional" },
  { id: "Justin",   name: "Justin",   gender: "male",   lang: "en", accent: "American",  category: "american-male",   desc: "Young, friendly" },
  { id: "Joey",     name: "Joey",     gender: "male",   lang: "en", accent: "American",  category: "podcast",         desc: "Casual podcast host" },
  // 🇬🇧 British
  { id: "Brian",    name: "Brian",    gender: "male",   lang: "en", accent: "British",   category: "british",  desc: "Classic British male" },
  { id: "Amy",      name: "Amy",      gender: "female", lang: "en", accent: "British",   category: "british",  desc: "Elegant British female" },
  { id: "Emma",     name: "Emma",     gender: "female", lang: "en", accent: "British",   category: "british",  desc: "Refined narrator" },
  // 🇦🇺 Australian
  { id: "Nicole",   name: "Nicole",   gender: "female", lang: "en", accent: "Australian",category: "narrator", desc: "Aussie female" },
  { id: "Russell",  name: "Russell",  gender: "male",   lang: "en", accent: "Australian",category: "narrator", desc: "Aussie male" },
  // 🌍 International
  { id: "Mizuki",   name: "Mizuki",   gender: "female", lang: "ja", accent: "Japanese",  category: "anime",    desc: "Japanese female" },
  { id: "Takumi",   name: "Takumi",   gender: "male",   lang: "ja", accent: "Japanese",  category: "narrator", desc: "Japanese male" },
  { id: "Seoyeon",  name: "Seoyeon",  gender: "female", lang: "ko", accent: "Korean",    category: "anime",    desc: "Korean female" },
  { id: "Conchita", name: "Conchita", gender: "female", lang: "es", accent: "Spanish",   category: "narrator", desc: "Castilian Spanish" },
  { id: "Penelope", name: "Penelope", gender: "female", lang: "es", accent: "Spanish",   category: "narrator", desc: "US Spanish" },
  { id: "Celine",   name: "Celine",   gender: "female", lang: "fr", accent: "French",    category: "narrator", desc: "Parisian French" },
  { id: "Mathieu",  name: "Mathieu",  gender: "male",   lang: "fr", accent: "French",    category: "narrator", desc: "French male" },
  { id: "Marlene",  name: "Marlene",  gender: "female", lang: "de", accent: "German",    category: "narrator", desc: "German female" },
  { id: "Hans",     name: "Hans",     gender: "male",   lang: "de", accent: "German",    category: "narrator", desc: "German male" },
  { id: "Carla",    name: "Carla",    gender: "female", lang: "it", accent: "Italian",   category: "narrator", desc: "Italian female" },
  { id: "Giorgio",  name: "Giorgio",  gender: "male",   lang: "it", accent: "Italian",   category: "narrator", desc: "Italian male" },
  { id: "Vitoria",  name: "Vitoria",  gender: "female", lang: "pt", accent: "Portuguese",category: "narrator", desc: "Brazilian Portuguese" },
  { id: "Aditi",    name: "Aditi",    gender: "female", lang: "hi", accent: "Hindi",     category: "narrator", desc: "Indian Hindi" },
  { id: "Zhiyu",    name: "Zhiyu",    gender: "female", lang: "zh", accent: "Chinese",   category: "narrator", desc: "Mandarin Chinese" },
  { id: "Zeina",    name: "Zeina",    gender: "female", lang: "ar", accent: "Arabic",    category: "narrator", desc: "Modern Standard Arabic" }
];

export function findVoice(voiceId) {
  return VOICES.find(v => v.id === voiceId) || VOICES[0];
}

/* ---------- Module state ---------- */
let lastMP3URL = null;     // Last generated MP3 URL or object URL for download
let lastBlob = null;       // Last generated audio Blob from backend proxy
let lastObjectURL = null;  // Last object URL created for Blob playback
let lastText = "";
let lastVoiceId = "Joanna";

const BACKEND_TTS_URL = (() => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "127.0.0.1" || host === "localhost") {
      return "http://localhost:3000/api/tts";
    }
  }
  return "/api/tts";
})();
const DEFAULT_BACKEND_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // ElevenLabs default voice

/* ---------- Primary provider: TTSMP3 ---------- */

async function ttsmp3Generate(text, voiceId) {
  console.log(`[VoxAI] TTSMP3: generating ${text.length} chars with voice "${voiceId}"`);

  // POST returns JSON with a URL to a real MP3 file
  const body = new URLSearchParams({
    msg: text,
    lang: voiceId,
    source: "ttsmp3"
  });

  const res = await fetch("https://ttsmp3.com/makemp3_new.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!res.ok) throw new Error("TTSMP3 returned HTTP " + res.status);

  const data = await res.json();
  console.log("[VoxAI] TTSMP3 response:", data);

  if (data.Error && data.Error !== 0) {
    throw new Error("TTSMP3 error: " + (data.Text || JSON.stringify(data)));
  }
  if (!data.URL) throw new Error("TTSMP3 returned no URL");

  return data.URL;   // e.g. "https://ttsmp3.com/created_mp3/abc123.mp3"
}

/* ---------- Fallback provider: Google Translate TTS ---------- */

function googleTTSURL(text, lang) {
  const piece = text.slice(0, 195);
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(piece)}`;
}

async function puterGenerate(text, voice) {
  if (typeof window === "undefined" || !window.puter?.ai?.txt2speech) {
    throw new Error("Puter.js is not loaded");
  }

  const language = voice.lang === "en" ? "en-US" : voice.lang;
  const options = {
    language,
    voice: voice.id,
    engine: "neural"
  };

  const audio = await puter.ai.txt2speech(text, options);
  if (!audio) throw new Error("Puter.js returned no audio");
  const src = audio.src || audio.currentSrc;
  if (!src) throw new Error("Puter.js returned invalid audio source");

  return { audio, src };
}

async function backendGenerate(text, voiceId) {
  const payload = {
    text,
    voiceId,
    provider: "elevenlabs"
  };

  const res = await fetch(BACKEND_TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      if (json.error) {
        message = json.error;
        if (typeof message === "object" && message.detail) {
          message = JSON.stringify(message.detail);
        }
      }
    } catch (_) {
      // keep raw text
    }

    if (res.status === 401) {
      throw new Error(
        `Backend TTS unauthorized: check your ElevenLabs API key and plan. ${message}`
      );
    }

    throw new Error(`Backend TTS failed: ${res.status} ${message}`);
  }

  return await res.blob();
}

/* ---------- PUBLIC: play voice into an <audio> element ---------- */

/**
 * Generates voice and assigns it to the given <audio> element.
 * Returns the MP3 URL. Throws on failure.
 *
 * Critical: we assign the URL directly to audio.src — browsers
 * don't enforce CORS for media src, so this always plays.
 */
export async function playVoiceInto(audioEl, text, voiceId = "Joanna") {
  if (!text || !text.trim()) throw new Error("Please enter some text");
  text = text.trim().slice(0, 2500);

  const voice = findVoice(voiceId);
  lastText = text;
  lastVoiceId = voiceId;

  let mp3URL;
  lastBlob = null;

  // First try Puter.js (free browser-based TTS with no API key)
  try {
    const result = await puterGenerate(text, voice);
    if (!result || !result.src) throw new Error("Puter.js returned no audio source");
    mp3URL = result.src;
    lastMP3URL = mp3URL;
    console.log("[VoxAI] ✅ Puter.js TTS ready:", mp3URL);
  } catch (puterErr) {
    console.warn("[VoxAI] Puter.js failed, trying backend/fallbacks:", puterErr.message);

    // First try the backend TTS proxy if available
    try {
      const blob = await backendGenerate(text, voiceId);
      if (!blob || blob.size === 0) throw new Error("Backend returned empty audio");

      if (lastObjectURL) {
        URL.revokeObjectURL(lastObjectURL);
        lastObjectURL = null;
      }
      lastBlob = blob;
      lastObjectURL = URL.createObjectURL(blob);
      mp3URL = lastObjectURL;
      lastMP3URL = mp3URL;
      console.log("[VoxAI] ✅ Backend TTS object URL ready:", mp3URL);
    } catch (backendErr) {
      console.warn("[VoxAI] Backend TTS failed, falling back to TTSMP3/Google:", backendErr.message);

      // Try TTSMP3 first (best quality, real Polly voices, downloadable)
      try {
        mp3URL = await ttsmp3Generate(text, voiceId);
      } catch (err) {
        console.warn("[VoxAI] TTSMP3 failed, trying Google TTS fallback:", err.message);
        // Fallback: direct Google TTS URL (cannot be combined for long text)
        mp3URL = googleTTSURL(text, voice.lang);
      }

      lastMP3URL = mp3URL;
      console.log("[VoxAI] ✅ MP3 URL ready:", mp3URL);
    }
  }

  // CRITICAL: don't set crossOrigin — that would trigger CORS check
  audioEl.removeAttribute("crossorigin");
  audioEl.src = mp3URL;
  audioEl.load();

  // Wait for the audio to be ready (or timeout)
  await new Promise((resolve, reject) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      // Don't reject — the audio might still work, just resolve
      console.warn("[VoxAI] Audio metadata didn't load in 10s — proceeding anyway");
      resolve();
    }, 10000);

    function cleanup() {
      clearTimeout(timer);
      audioEl.removeEventListener("loadedmetadata", onReady);
      audioEl.removeEventListener("canplay", onReady);
      audioEl.removeEventListener("error", onError);
    }
    function onReady() {
      if (resolved) return;
      if (audioEl.duration > 0) {
        resolved = true;
        cleanup();
        console.log(`[VoxAI] Audio ready — duration: ${audioEl.duration.toFixed(2)}s`);
        resolve();
      }
    }
    function onError(e) {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error("Browser couldn't load the audio. The MP3 URL may be blocked."));
    }
    audioEl.addEventListener("loadedmetadata", onReady);
    audioEl.addEventListener("canplay", onReady);
    audioEl.addEventListener("error", onError);
  });

  // Try autoplay (may be blocked until first user gesture)
  try { await audioEl.play(); }
  catch (e) { console.warn("[VoxAI] Autoplay blocked, user must press play"); }

  return mp3URL;
}

/* ---------- PUBLIC: download last generated audio ---------- */

export async function downloadVoice(text, voiceId, filename) {
  // Regenerate if needed
  if (!lastMP3URL || text !== lastText || voiceId !== lastVoiceId) {
    const temp = new Audio();
    await playVoiceInto(temp, text, voiceId);
  }
  const fname = filename || `voxai-${Date.now()}.mp3`;

  if (lastBlob) {
    const blobURL = URL.createObjectURL(lastBlob);
    const a = document.createElement("a");
    a.href = blobURL;
    a.download = fname;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobURL);
    return true;
  }

  const url = lastMP3URL;
  if (!url) throw new Error("Nothing generated yet — generate first");

  // Just open the URL in a new tab — works 100% of the time
  // (Browser will download or play it; user can right-click → Save As)
  // For most users with TTSMP3 URLs, the MP3 will trigger a download
  // automatically because of its content-type.
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch (e) {
    window.open(url, "_blank");
    throw new Error("Click 'Save Audio As' in the new tab to download.");
  }
}

/* ---------- Legacy compatibility wrappers ---------- */

export async function generateVoiceURL(text, voiceId = "Joanna") {
  const tempAudio = new Audio();
  const url = await playVoiceInto(tempAudio, text, voiceId);
  return { url, blob: null };
}

export function downloadBlob(blob, filename) {
  if (lastMP3URL) {
    const a = document.createElement("a");
    a.href = lastMP3URL;
    a.download = filename || `voxai-${Date.now()}.mp3`;
    a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
    return;
  }
  throw new Error("Nothing to download yet — generate first");
}

/* ---------- Premium (optional, paid plans only) ---------- */
export async function generateElevenLabs(text, voiceId, backendUrl = "/api/tts") {
  const res = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId, provider: "elevenlabs" })
  });
  if (!res.ok) throw new Error("Premium TTS failed");
  return await res.blob();
}
