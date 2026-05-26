# 🚀 VoxAI Production Setup Guide

This guide will take you from zero to a fully working live site in **about 30 minutes**.

---

## ✅ What's already done (production-ready)

| Feature | Status | Tech |
|---|---|---|
| Real voice generation | ✅ Working | StreamElements TTS (free, no API key) |
| Real authentication | ✅ Ready | Firebase Auth (email + Google) |
| Real user accounts | ✅ Ready | Firestore database |
| Real credit system | ✅ Ready | Atomic Firestore increments |
| Real generation history | ✅ Ready | Firestore subcollections |
| Real favorites | ✅ Ready | Firestore subcollections |
| Route protection | ✅ Ready | Auth guards on /dashboard, /generator |
| Password reset | ✅ Ready | Firebase email |
| Google sign-in | ✅ Ready | OAuth popup |
| Daily credit reset | ✅ Ready | Auto-reset on login |
| Real MP3 downloads | ✅ Working | Blob download |
| Responsive design | ✅ Done | Mobile/tablet/desktop |
| SEO meta tags | ✅ Done | Per page |
| Legal pages | ✅ Done | Privacy + Terms |
| Affiliate placeholders | ✅ Done | Update links |
| Ad slots | ✅ Done | Replace with AdSense |
| Rewarded ad flow | ✅ Done (simulated) | Swap for real SDK |

---

## STEP 1 — Set up Firebase (5 min) ⭐ REQUIRED

This is the most important step. Without this, login/signup won't work.

### 1.1 Create a Firebase project
1. Go to <https://console.firebase.google.com>
2. Click **"Add project"** → name it `voxai` → continue
3. Disable Google Analytics (optional, can add later) → Create

### 1.2 Add a web app
1. On the project home screen click the **`</>` Web** icon
2. App nickname: `voxai-web` → Register app
3. **Copy the firebaseConfig object** that appears

### 1.3 Paste it into the code
Open `js/firebase-config.js` and replace the placeholder `firebaseConfig` with your real one.

### 1.4 Enable Authentication
1. Left sidebar → **Build → Authentication → Get started**
2. **Sign-in method** tab → enable:
   - **Email/Password** → Save
   - **Google** → Add support email → Save

### 1.5 Enable Firestore Database
1. Left sidebar → **Build → Firestore Database → Create database**
2. Choose **"Start in production mode"**
3. Pick a region close to your users (e.g. `us-central` or `eur3`) → Enable

### 1.6 Set up security rules
1. Firestore → **Rules** tab → paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /history/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /favorites/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

2. Click **Publish**

### 1.7 Whitelist your domain
1. Authentication → **Settings → Authorized domains**
2. Add your production domain (e.g. `voxai.com`). `localhost` is already there.

**✅ Done! Auth + database is now live.**

---

## STEP 2 — Run locally (1 min)

ES modules need to be served from a web server, not opened directly. Pick any:

```bash
# Option A: Python (already installed on most systems)
cd voicegen
python3 -m http.server 8000
# Open http://localhost:8000

# Option B: Node
npx serve voicegen

# Option C: VS Code "Live Server" extension → right-click index.html → Open with Live Server
```

## STEP 2b — Run the AI voice backend proxy

A backend proxy is included in `server.js`. It forwards text requests to ElevenLabs and returns real MP3 audio.

1. Copy `.env.example` to `.env`.
2. Set `ELEVENLABS_API_KEY` to your ElevenLabs API key.
3. Optionally set `ELEVENLABS_VOICE_ID` to a supported voice ID.
4. Run:

```bash
cd "d:\Pictures\New folder"
npm install
npm start
```

Then open `http://localhost:3000/generator.html` to use the AI voice backend proxy.

Test the flow:
1. Open `http://localhost:8000`
2. Click **Get Started** → register an account → you should land on the dashboard
3. Click **AI Generator** → type some text → click **Generate** → you'll hear real audio
4. Click **Download MP3** → real MP3 file downloads
5. Refresh dashboard → your generation appears in history

---

## STEP 3 — Deploy to the web (10 min)

### Option A — Firebase Hosting (recommended, free, integrates with Auth)

```bash
npm install -g firebase-tools
cd voicegen
firebase login
firebase init hosting
#   - Use an existing project → select your voxai project
#   - Public directory: . (current directory)
#   - Single-page app: No
#   - GitHub deploys: No (optional)
firebase deploy
```

You'll get a live URL like `https://voxai.web.app` immediately.

### Option B — Cloudflare Pages (free, global CDN)
1. Push the `voicegen/` folder to GitHub
2. Go to <https://pages.cloudflare.com> → Connect to Git → select repo
3. Build command: *(leave empty)*
4. Build output: *(leave empty)*
5. Deploy

### Option C — Netlify (drag & drop)
1. Go to <https://app.netlify.com/drop>
2. Drag the `voicegen/` folder onto the page
3. Done

### Option D — Vercel
```bash
npm i -g vercel
cd voicegen
vercel
```

⚠️ **After deploying:** go back to **Firebase → Authentication → Settings → Authorized domains** and add your new live domain.

---

## STEP 4 — Set up Google AdSense (passive income)

### Requirements
- Live website with original content (you have it ✅)
- Privacy Policy + Terms (already added ✅)
- At least 10–20 quality blog articles (write more using `blog-post.html` as template)
- 3+ months of consistent traffic helps approval

### Steps
1. Apply at <https://www.google.com/adsense/start>
2. Add your site domain
3. Paste their verification snippet (already commented out in `index.html` — uncomment and add your `ca-pub-XXX` ID)
4. Wait for approval (1–14 days)
5. Once approved, create Ad units in AdSense dashboard
6. Replace each `<div class="ad-slot">…</div>` in your HTML with the real AdSense code:

```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="YOUR_SLOT_ID"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

**AdSense alternatives** (easier approval): **Ezoic**, **PropellerAds**, **Adsterra**, **Media.net**, **Monetag**.

---

## STEP 5 — Set up Rewarded Ads (highest RPM on the tool page)

AdSense itself doesn't offer rewarded ads for the web, so use:

| Network | Sign-up URL | Notes |
|---|---|---|
| **AdinPlay** | adinplay.com | Best for web rewarded video |
| **Adsterra Rewarded** | adsterra.com | Global, easy approval |
| **PropellerAds** | propellerads.com | Multiple ad formats |
| **Monetag** | monetag.com | Modern UI, push + rewarded |

Once you have your SDK script, open `js/generator.js`, find the `watchAdBtn` block, and replace the simulation:

```js
watchAdBtn.addEventListener("click", () => {
  // Real example with AdinPlay-style SDK:
  window.YourAdSDK.showRewarded({
    onReward:    async () => { await addCredits(3); refreshCreditDisplay(); toast("🎉 +3 credits!"); },
    onSkip:      () => toast("Ad skipped"),
    onError:     () => toast("Ad failed to load")
  });
});
```

---

## STEP 6 — Set up Affiliate Programs (highest ROI)

Affiliate marketing pays **much more per visitor** than display ads. Here's exactly how to start.

### 6.1 Pick programs relevant to your audience

| Program | What you earn | Sign-up |
|---|---|---|
| **Amazon Associates** | 1–10% on every sale | affiliate-program.amazon.com |
| **Hostinger** | $60+ per signup | hostinger.com/affiliates |
| **Bluehost** | $65 per sale | bluehost.com/affiliates |
| **ElevenLabs** | 20% recurring | elevenlabs.io (scroll to footer) |
| **Adobe Creative Cloud** | 85% of first month + 8.33% recurring | partners.adobe.com |
| **Descript** | 15% recurring | descript.com/affiliate |
| **Canva Pro** | $36 per signup | canva.com/affiliates |
| **NameCheap** | 20% per sale | namecheap.com/affiliates |
| **Cloudflare** | $50 per signup | cloudflare.com/partners |
| **Skillshare** | $7 per trial | partners.skillshare.com |

### 6.2 Use aggregator networks (one login, hundreds of programs)
- **Impact** (impact.com) – Adobe, Canva, Logitech, etc.
- **PartnerStack** (partnerstack.com) – mostly SaaS tools
- **ShareASale** (shareasale.com) – ecommerce, tools
- **CJ Affiliate** (cj.com) – huge brand catalog
- **Rakuten Advertising** – big retailers

### 6.3 Replace the placeholder links

Open these files and replace each `href="#"` with your real referral URL:
- `creator-tools.html` (all the cards)
- `blog-post.html` (in-article links)
- `index.html` (creator tools section)

Example before:
```html
<a href="#" rel="nofollow sponsored">Shure SM7B</a>
```
Example after:
```html
<a href="https://amzn.to/3xYourTrackingID" rel="nofollow sponsored">Shure SM7B</a>
```

### 6.4 Best practices
- **Always disclose** that you use affiliate links (already in your Privacy Policy ✅)
- **Use `rel="nofollow sponsored"`** on every affiliate link (already done ✅)
- **Recommend tools you'd actually use** — trust = clicks
- **Write reviews and comparisons** in your blog (Amazon link from a review converts 5–10× better than a banner)
- **Place links in HIGH-INTENT pages**: tutorials, "best X tools" posts, comparison articles

### 6.5 Track performance
Add **Google Analytics 4** + each network's tracking dashboard. Use **UTM parameters** like:
```
https://hostinger.com/ref/yourcode?utm_source=voxai&utm_medium=blog&utm_campaign=best-hosting
```

---

## STEP 7 — Premium voices (ElevenLabs) for paid plans

When users upgrade to Pro, give them ElevenLabs-quality voices. This requires a small backend (free hosting available).

### 7.1 Get an ElevenLabs API key
- Sign up at <https://elevenlabs.io>
- Free tier: 10,000 characters/month
- Get key from Profile → API Keys

### 7.2 Deploy a serverless proxy (Cloudflare Workers — free)

1. Go to <https://dash.cloudflare.com/sign-up>
2. Workers & Pages → Create Worker → name `voxai-tts`
3. Paste this code:

```js
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST")   return new Response("Method not allowed", { status: 405 });

    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = await request.json();

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": env.ELEVENLABS_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    return new Response(r.body, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" }
    });
  }
};
```

4. Settings → Variables → add `ELEVENLABS_KEY` with your key (encrypted)
5. Deploy → copy your Worker URL (e.g. `https://voxai-tts.you.workers.dev`)

### 7.3 Wire it into the front-end

In `js/voice-service.js`, find `generateElevenLabs()` and update the backend URL:
```js
const backendUrl = "https://voxai-tts.you.workers.dev";
```

In `js/generator.js`, add a check for plan:
```js
const profile = await getUserProfile();
const provider = profile.plan === "pro" ? "elevenlabs" : "streamelements";
const { url, blob } = provider === "elevenlabs"
  ? { url: URL.createObjectURL(await generateElevenLabs(text, voiceId, "https://YOUR-WORKER.workers.dev")), blob: ... }
  : await generateVoiceURL(text, currentVoiceId);
```

---

## STEP 8 — Stripe Payments for Creator/Pro plans

### Quick setup
1. Sign up at <https://stripe.com>
2. Dashboard → Products → create "Creator Monthly" ($9) and "Pro Monthly" ($29)
3. Copy each Price ID (`price_xxx`)
4. Use **Payment Links** for the easiest setup (no backend!):
   - Products → click product → Create payment link
   - Copy URL
5. In `pricing.html`, change the "Choose Creator" button:
```html
<a href="https://buy.stripe.com/yourLinkHere" class="btn btn-primary">Choose Creator</a>
```
6. Set success URL to `https://voxai.com/dashboard.html?upgraded=1`

To grant Pro status after payment, use **Stripe webhooks** → Cloud Function that updates the user's `plan` field in Firestore. See Stripe docs: <https://stripe.com/docs/webhooks>

---

## STEP 9 — SEO + Analytics

### Google Analytics 4
1. Sign up at <https://analytics.google.com>
2. Create property → Get measurement ID (`G-XXXXXXX`)
3. Add to every `<head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

### Google Search Console
1. Verify ownership at <https://search.google.com/search-console>
2. Submit your sitemap (create `sitemap.xml`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://voxai.com/</loc><priority>1.0</priority></url>
  <url><loc>https://voxai.com/generator.html</loc><priority>0.9</priority></url>
  <url><loc>https://voxai.com/voice-library.html</loc><priority>0.8</priority></url>
  <url><loc>https://voxai.com/pricing.html</loc><priority>0.7</priority></url>
  <url><loc>https://voxai.com/blog.html</loc><priority>0.7</priority></url>
  <url><loc>https://voxai.com/about.html</loc><priority>0.5</priority></url>
</urlset>
```

Also add a `robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://voxai.com/sitemap.xml
```

### SEO Quick wins
- Write 10+ blog articles targeting "best ai voice generator", "free text to speech", "tiktok voice generator"
- Add **Open Graph** tags for social sharing
- Get backlinks from product directories (Product Hunt, BetaList, AlternativeTo, FutureTools)

---

## STEP 10 — Going from MVP to scale

When you start getting real users, add:

| Feature | Tool | Cost |
|---|---|---|
| Email broadcasts | Mailchimp / Beehiiv | Free up to 500 contacts |
| User support chat | Crisp / Tawk | Free |
| Error monitoring | Sentry | Free up to 5k events/mo |
| Custom domain email | Zoho Mail / Google Workspace | Free / $6/mo |
| Status page | StatusPage / BetterStack | Free tier |
| CDN for audio files | Cloudflare R2 | Free 10GB |
| Permanent audio storage | Firebase Storage | 5GB free |

---

## 📋 LAUNCH CHECKLIST

- [ ] Firebase config in `js/firebase-config.js` is real
- [ ] Email + Google sign-in enabled in Firebase
- [ ] Firestore rules published
- [ ] Site deployed to a real domain
- [ ] Production domain added to Firebase authorized domains
- [ ] All `href="#"` affiliate links replaced with real referral URLs
- [ ] Privacy + Terms pages updated with your company info
- [ ] Contact email updated everywhere (`support@voxai.example` → your real email)
- [ ] Google Analytics installed
- [ ] Google Search Console verified + sitemap submitted
- [ ] AdSense application submitted (after 10+ blog posts)
- [ ] 10+ blog articles published for SEO
- [ ] Tested signup → login → generate → download flow on mobile
- [ ] Tested on Chrome, Firefox, Safari

---

## 🆘 TROUBLESHOOTING

**"Firebase: Error (auth/api-key-not-valid)"**
→ You haven't replaced the placeholder config in `js/firebase-config.js` yet.

**Login works but Firestore data isn't saving**
→ You didn't publish the Firestore security rules in step 1.6.

**Google sign-in popup is blocked**
→ Browser is blocking popups. Tell users to allow popups for your domain.

**Voice generation says "failed"**
→ Browser is blocking the StreamElements call. Check Network tab. CORS is allowed by StreamElements. If hitting rate limit, switch to VoiceRSS or ElevenLabs.

**The page is blank**
→ ES Modules must be served via HTTP, not from `file://`. Use `python3 -m http.server`.

**Dashboard shows "Loading..." forever**
→ Open browser console (F12). You probably have a Firebase config or Firestore rules error.

---

Built with ❤️ — good luck with your launch! 🚀
