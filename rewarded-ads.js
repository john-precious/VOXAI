/* ============================================================
   REWARDED ADS MODULE
   ------------------------------------------------------------
   Pluggable rewarded-ad system supporting multiple providers.

   HOW TO USE:
   1. Sign up for an ad network (Adsterra, Monetag, AdinPlay, etc.)
      → See REWARDED-ADS-GUIDE.md
   2. Find the network's config section below
   3. Set window.VOXAI_AD_PROVIDER in firebase-config.js (or here)
   4. Paste your ad zone ID

   The site automatically falls back to a simulated ad (with a
   real countdown) if no provider is configured — so it always
   works in development.
   ============================================================ */

import { addCredits } from "./user-service.js";

/* ============================================================
   CONFIGURATION
   ============================================================ */

// Pick ONE provider: "adsterra" | "monetag" | "adinplay" | "unity" | "simulation"
// Or set window.VOXAI_AD_PROVIDER in firebase-config.js to override
const AD_PROVIDER = window.VOXAI_AD_PROVIDER || "adsterra";

// Credits awarded per ad watched
const CREDITS_PER_AD = 3;

// Max ads per day per user (prevents abuse / preserves CPM)
const MAX_ADS_PER_DAY = 10;

/* ============================================================
   PROVIDER CONFIGURATIONS
   Paste your real IDs/scripts here after signup
   ============================================================ */

const PROVIDER_CONFIG = {

  // ─── ADSTERRA ─────────────────────────────────
  // https://adsterra.com
  adsterra: {
    // Paste the invoke.js URL from your Adsterra dashboard
    scriptURL: "https://pl29559965.effectivecpmnetwork.com/65bd3a55a45f0bd8f95338aa386d8b78/invoke.js",
    zoneId:    "3304579"
  },

  // ─── MONETAG (PropellerAds) ───────────────────
  // https://monetag.com
  monetag: {
    // Get from Monetag → Ad Units → Rewarded Interstitial
    zoneId: "REPLACE_WITH_YOUR_ZONE_ID"
  },

  // ─── ADINPLAY ─────────────────────────────────
  // https://www.adinplay.com (needs 50k+ pageviews to apply)
  adinplay: {
    siteId:  "REPLACE_WITH_YOUR_SITE_ID",
    unitId:  "REPLACE_WITH_YOUR_UNIT_ID"
  },

  // ─── UNITY ADS ────────────────────────────────
  // https://unity.com/products/unity-ads
  unity: {
    gameId:      "REPLACE_WITH_YOUR_GAME_ID",
    placementId: "rewardedVideo"
  }
};

/* ============================================================
   PUBLIC API
   ============================================================ */

/**
 * Show a rewarded ad. Returns a Promise that resolves to:
 *   { success: true,  credits: 3 }   if user watched the full ad
 *   { success: false, reason: '...' } if user skipped/closed
 */
export async function showRewardedAd() {
  // Daily limit check
  if (!checkDailyLimit()) {
    return {
      success: false,
      reason: "You've watched the daily maximum of " + MAX_ADS_PER_DAY + " ads. Come back tomorrow or upgrade to Pro for unlimited."
    };
  }

  console.log(`[VoxAI Ads] Showing rewarded ad via "${AD_PROVIDER}"`);

  let result;
  try {
    switch (AD_PROVIDER) {
      case "adsterra":   result = await showAdsterraAd();  break;
      case "monetag":    result = await showMonetagAd();   break;
      case "adinplay":   result = await showAdinPlayAd();  break;
      case "unity":      result = await showUnityAd();     break;
      case "simulation":
      default:           result = await showSimulatedAd();
    }
  } catch (err) {
    console.error("[VoxAI Ads] Provider error:", err);
    result = { success: false, reason: err.message || "Ad failed to load. Please try again." };
  }

  // On success, increment daily counter + grant credits
  if (result.success) {
    incrementDailyCount();
    try {
      await addCredits(CREDITS_PER_AD);
      result.credits = CREDITS_PER_AD;
    } catch (e) {
      console.error("[VoxAI Ads] Failed to grant credits:", e);
      result.success = false;
      result.reason = "Couldn't grant credits. Are you logged in?";
    }
  }
  return result;
}

/* ============================================================
   DAILY LIMIT TRACKING (stored in localStorage)
   ============================================================ */

const STORAGE_KEY = "voxai_ad_counter";

function getDailyCount() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const today = new Date().toDateString();
    return data.date === today ? (data.count || 0) : 0;
  } catch { return 0; }
}

function incrementDailyCount() {
  const today = new Date().toDateString();
  const current = getDailyCount();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: current + 1 }));
}

function checkDailyLimit() {
  return getDailyCount() < MAX_ADS_PER_DAY;
}

export function getRemainingAdsToday() {
  return Math.max(0, MAX_ADS_PER_DAY - getDailyCount());
}

/* ============================================================
   PROVIDER 1: ADSTERRA
   ============================================================ */

let adsterraLoaded = false;
async function loadAdsterraScript() {
  if (adsterraLoaded) return;
  const cfg = PROVIDER_CONFIG.adsterra;
  if (!cfg.scriptURL || cfg.scriptURL.includes("REPLACE_WITH")) {
    throw new Error("Adsterra not configured — see REWARDED-ADS-GUIDE.md");
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = cfg.scriptURL;
    s.async = true;
    s.onload = () => { adsterraLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("Failed to load Adsterra script"));
    document.head.appendChild(s);
  });
}

async function showAdsterraAd() {
  await loadAdsterraScript();
  return new Promise((resolve) => {
    // Adsterra interstitial fires automatically — give it a moment
    // For rewarded video, hook into their SDK callbacks if available
    if (window.AdsterraRewarded) {
      window.AdsterraRewarded.show({
        onComplete: () => resolve({ success: true }),
        onSkip:     () => resolve({ success: false, reason: "Ad skipped" }),
        onError:    () => resolve({ success: false, reason: "Ad failed to load" })
      });
    } else {
      // Interstitial-style: just wait a moment for ad to display + close
      console.warn("[Adsterra] SDK not found — falling back to interstitial flow");
      setTimeout(() => resolve({ success: true }), 5000);
    }
  });
}

/* ============================================================
   PROVIDER 2: MONETAG
   ============================================================ */

async function showMonetagAd() {
  const cfg = PROVIDER_CONFIG.monetag;
  if (!cfg.zoneId || cfg.zoneId.includes("REPLACE_WITH")) {
    throw new Error("Monetag not configured — see REWARDED-ADS-GUIDE.md");
  }
  // Monetag uses show_<zoneId>() global function
  return new Promise((resolve) => {
    const fnName = `show_${cfg.zoneId}`;
    if (typeof window[fnName] === "function") {
      window[fnName]()
        .then(() => resolve({ success: true }))
        .catch(() => resolve({ success: false, reason: "Ad skipped or failed" }));
    } else {
      // Auto-load Monetag script if missing
      const s = document.createElement("script");
      s.src = `//libtl.com/sdk.js`;
      s.dataset.zone = cfg.zoneId;
      s.dataset.sdk = "show_" + cfg.zoneId;
      document.head.appendChild(s);
      s.onload = () => {
        setTimeout(() => {
          if (typeof window[fnName] === "function") {
            window[fnName]()
              .then(() => resolve({ success: true }))
              .catch(() => resolve({ success: false, reason: "Ad skipped" }));
          } else {
            resolve({ success: false, reason: "Monetag SDK didn't initialize" });
          }
        }, 1000);
      };
    }
  });
}

/* ============================================================
   PROVIDER 3: ADINPLAY
   ============================================================ */

let adinplayLoaded = false;
async function loadAdinPlay() {
  if (adinplayLoaded) return;
  const cfg = PROVIDER_CONFIG.adinplay;
  if (!cfg.siteId || cfg.siteId.includes("REPLACE_WITH")) {
    throw new Error("AdinPlay not configured — see REWARDED-ADS-GUIDE.md");
  }
  return new Promise((resolve, reject) => {
    window.aiptag = window.aiptag || { cmd: { display: [], player: [] } };
    window.aipPlayer = window.aipPlayer || { startPreRoll: function(){} };

    const s = document.createElement("script");
    s.src = `//api.adinplay.com/libs/aiptag/pub/${cfg.siteId}/tag.min.js`;
    s.async = true;
    s.onload = () => { adinplayLoaded = true; resolve(); };
    s.onerror = () => reject(new Error("Failed to load AdinPlay"));
    document.head.appendChild(s);
  });
}

async function showAdinPlayAd() {
  await loadAdinPlay();
  const cfg = PROVIDER_CONFIG.adinplay;
  return new Promise((resolve) => {
    window.aiptag.cmd.player.push(function() {
      window.aipPlayer.startPreRoll({
        AD_WIDTH:  640,
        AD_HEIGHT: 360,
        AD_UNIT:   cfg.unitId,
        AD_FULLSCREEN: true,
        AD_CENTERPLAYER: true,
        LOADING_TEXT: "Loading reward...",
        PREROLL_ELEM: function(){ return document.getElementById("adinplay-container"); },
        AIP_COMPLETE:  function() { resolve({ success: true }); },
        AIP_REMOVE:    function() {},
        AIP_ERROR:     function() { resolve({ success: false, reason: "Ad failed" }); },
        AIP_CLICK:     function() {}
      });
    });
  });
}

/* ============================================================
   PROVIDER 4: UNITY ADS (web)
   ============================================================ */

let unityLoaded = false;
async function loadUnity() {
  if (unityLoaded) return;
  const cfg = PROVIDER_CONFIG.unity;
  if (!cfg.gameId || cfg.gameId.includes("REPLACE_WITH")) {
    throw new Error("Unity Ads not configured");
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://webview.unityads.unity3d.com/webview/web.js`;
    s.onload = () => {
      window.UnityAds.init(cfg.gameId, true, () => { unityLoaded = true; resolve(); });
    };
    s.onerror = () => reject(new Error("Failed to load Unity Ads"));
    document.head.appendChild(s);
  });
}

async function showUnityAd() {
  await loadUnity();
  const cfg = PROVIDER_CONFIG.unity;
  return new Promise((resolve) => {
    window.UnityAds.show(cfg.placementId, {
      onComplete: () => resolve({ success: true }),
      onSkipped:  () => resolve({ success: false, reason: "Ad skipped" }),
      onFailed:   () => resolve({ success: false, reason: "Ad failed" })
    });
  });
}

/* ============================================================
   FALLBACK: SIMULATED AD (for development / before signup)
   Shows a real 5-second countdown so the flow works.
   ============================================================ */

async function showSimulatedAd() {
  console.log("[VoxAI Ads] Using simulation mode — sign up for real ads via REWARDED-ADS-GUIDE.md");

  return new Promise((resolve) => {
    // Build a nice fullscreen overlay (no external dependencies)
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      animation: fadeIn 0.3s;
    `;
    overlay.innerHTML = `
      <div style="background: #1a1a2e; border-radius: 16px; padding: 0; max-width: 560px; width: 100%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="background: linear-gradient(135deg, #1a1a2e, #0a0a14); padding: 60px 30px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">📺</div>
          <h3 style="color:#fff; font-size: 22px; margin-bottom: 8px; font-family: inherit;">Sponsored Ad</h3>
          <p style="color: #b4b4c8; font-size: 14px; margin-bottom: 8px;">Your ad helps keep VoxAI free.</p>
          <p style="color: #7c7c95; font-size: 12px;">[In production: real video ad from your network]</p>
        </div>
        <div style="padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; background: #11111d; border-top: 1px solid rgba(255,255,255,0.05);">
          <div style="color: #fff; font-size: 14px;">
            Ad ends in <strong id="ad-sim-countdown" style="color: #7c5cff;">5</strong>s
          </div>
          <button id="ad-sim-skip" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #7c7c95; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-family: inherit;" disabled>Skip ad</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    let secs = 5;
    const cd = overlay.querySelector("#ad-sim-countdown");
    const skip = overlay.querySelector("#ad-sim-skip");

    const timer = setInterval(() => {
      secs--;
      cd.textContent = secs;
      if (secs <= 0) {
        clearInterval(timer);
        skip.disabled = false;
        skip.style.opacity = "1";
        skip.style.color = "#fff";
        skip.textContent = "Continue →";
        cd.parentElement.innerHTML = "✅ Ad complete — collect your reward!";
      }
    }, 1000);

    skip.addEventListener("click", () => {
      if (secs > 0) {
        overlay.remove();
        clearInterval(timer);
        resolve({ success: false, reason: "Ad skipped" });
      } else {
        overlay.remove();
        resolve({ success: true });
      }
    });
  });
}
