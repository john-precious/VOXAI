# 🎙 VoxAI – AI Voice Generator Website

A complete, production-ready front-end for an AI voice generator platform.

## 📂 File structure

```
voicegen/
├── index.html              ← Homepage (hero, demo, features, pricing, FAQ)
├── generator.html          ← Main TTS tool (with rewarded ads + credit system)
├── voice-library.html      ← Browse all voices by category
├── pricing.html            ← Free / Creator / Pro plans
├── blog.html               ← Blog listing
├── blog-post.html          ← Single article template
├── creator-tools.html      ← Affiliate recommendations
├── dashboard.html          ← User dashboard (credits, history, favorites)
├── login.html
├── register.html
├── about.html
├── contact.html
├── privacy.html
├── terms.html
├── css/
│   └── style.css           ← All shared styling (dark theme + gradients)
├── js/
│   ├── main.js             ← Global script (nav, FAQ, credits, history)
│   └── generator.js        ← Tool-specific logic (TTS, rewarded ads)
└── assets/                 ← (empty – for future images/logos)
```

## 🚀 Run locally

Just open `index.html` in your browser. No build step needed.

For best results (avoids CORS issues with audio blobs), serve with a tiny static server:

```bash
cd voicegen
python3 -m http.server 8000
# then open http://localhost:8000
```

### Optional backend proxy

A backend proxy is included in `server.js` so the AI generator can use a secure ElevenLabs TTS endpoint instead of relying only on browser-based or third-party public TTS links.

1. Copy `.env.example` to `.env`.
2. Set `ELEVENLABS_API_KEY=your_elevenlabs_api_key_here`.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000/generator.html`.

---

# 🔌 HOW TO INTEGRATE A REAL AI VOICE API

The current site uses your browser's built-in `SpeechSynthesis` (free, no API key) just for the demo. Below is exactly how to swap in a real, production-grade voice API.

## Step 1 — Pick a TTS provider

| Provider | Quality | Free Tier | Best For |
|---|---|---|---|
| **ElevenLabs** | ⭐⭐⭐⭐⭐ | 10k chars/mo free | Most realistic voices, voice cloning |
| **OpenAI TTS** | ⭐⭐⭐⭐⭐ | Pay-as-you-go | Cheap + high quality (6 voices) |
| **Google Cloud TTS** | ⭐⭐⭐⭐ | 1M chars/mo free | 380+ voices, 50+ languages |
| **Azure Speech** | ⭐⭐⭐⭐ | 500k chars/mo free | Enterprise + neural voices |
| **PlayHT** | ⭐⭐⭐⭐ | Trial only | Long-form audio |
| **Coqui / Piper (self-hosted)** | ⭐⭐⭐ | 100% free | Hosting your own |

👉 **My recommendation:** Start with **ElevenLabs** (best voices) or **OpenAI TTS** (cheapest at high quality).

## Step 2 — You CANNOT call APIs directly from the browser

Your API key would be visible to anyone. You MUST use a small backend proxy. Here are 3 easy options:

### Option A — Node.js + Express (simplest)

```bash
mkdir voxai-backend && cd voxai-backend
npm init -y
npm install express cors dotenv node-fetch
```

`server.js`:

```js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// ElevenLabs example
app.post('/api/tts', async (req, res) => {
  const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body;
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    const buf = await r.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buf));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('TTS API running on :3000'));
```

`.env`:
```
ELEVENLABS_KEY=sk_your_real_key_here
```

### Option B — Cloudflare Workers (free tier, fastest)

```js
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = await request.json();

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
    });
    return new Response(r.body, {
      headers: { 'Content-Type': 'audio/mpeg', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
```

### Option C — Vercel / Netlify serverless function

Drop this in `/api/tts.js`:

```js
export default async function handler(req, res) {
  const { text, voiceId } = req.body;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const buf = await r.arrayBuffer();
  res.setHeader('Content-Type', 'audio/mpeg');
  res.send(Buffer.from(buf));
}
```

## Step 3 — Wire the front-end to your backend

Open `js/generator.js` and **replace** the `synthesizeWithBrowser()` call inside `generate()` with:

```js
async function synthesizeWithAPI(text, voiceId) {
  const res = await fetch('https://YOUR-BACKEND-URL/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId })
  });
  if (!res.ok) throw new Error('TTS failed');
  return await res.blob(); // audio/mpeg blob
}
```

Then in `generate()`:

```js
const audioBlob = await synthesizeWithAPI(text, 'YOUR_VOICE_ID');
lastBlobUrl = URL.createObjectURL(audioBlob);
resultAudio.src = lastBlobUrl;
```

Boom — real AI voices.

---

# 💰 AD INTEGRATION GUIDE

## 1. Google AdSense (banner + in-content)

1. Apply at <https://www.google.com/adsense/>
2. Get approved (need policy pages — included ✅)
3. Add this to every `<head>`:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

4. Replace each `<div class="ad-slot">…</div>` with your real ad unit:

```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="YOUR_SLOT_ID"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

## 2. Rewarded Ads (the big money on tool pages)

AdSense itself doesn't offer web rewarded ads, so use:

- **AdinPlay** (`https://www.adinplay.com`) – easy rewarded video for web
- **Adsterra Rewarded** – global fill rates
- **Propeller Ads** – rewarded interstitials
- **Unity Ads for Web** – great if you have gamer audience
- **CodeFuel / Persona.ly** – higher RPM in US/UK

After signup they'll give you a JS snippet. Replace the simulated `watchAdBtn` handler in `js/generator.js` with their SDK:

```js
watchAdBtn.addEventListener('click', () => {
  YourAdSDK.showRewarded({
    onReward:    () => { addCredits(3); toast('🎉 +3 credits!'); },
    onSkip:      () => toast('Ad skipped — no credits given'),
    onError:     () => toast('Ad failed to load')
  });
});
```

## 3. Affiliate Programs (highest ROI)

Sign up for these and put your real referral links into `creator-tools.html` and `blog-post.html`:

- **Amazon Associates** — microphones, gear
- **ElevenLabs affiliate program**
- **Hostinger / Bluehost** ($65+ per sale)
- **Adobe Creative Cloud affiliate**
- **Impact / PartnerStack / ShareASale** — central dashboards

---

# 🔒 USER AUTHENTICATION (when ready)

The current login/register pages are visual mocks. To make them real:

1. **Backend:** Use **Supabase** (easiest) or **Firebase Auth** — both have free tiers.
2. Add the SDK to your pages:

```html
<script type="module">
  import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
  const supabase = createClient('https://YOUR.supabase.co', 'YOUR_ANON_KEY');

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const [email, password] = e.target.querySelectorAll('input');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value, password: password.value
    });
    if (error) toast(error.message);
    else window.location.href = 'dashboard.html';
  });
</script>
```

3. Use the Supabase DB to store: `users`, `generations`, `credits`, `favorites`.

---

# 💳 PAYMENTS (Creator / Pro plans)

Use **Stripe Checkout** (5 lines of code):

```js
// On click "Choose Creator"
fetch('/api/checkout', { method:'POST', body: JSON.stringify({ plan:'creator' }) })
  .then(r => r.json())
  .then(({ url }) => window.location = url);
```

Backend:
```js
const stripe = require('stripe')(process.env.STRIPE_SECRET);
app.post('/api/checkout', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: 'price_xxx_creator_monthly', quantity: 1 }],
    success_url: 'https://voxai.com/dashboard.html?paid=1',
    cancel_url:  'https://voxai.com/pricing.html'
  });
  res.json({ url: session.url });
});
```

---

# 🌐 DEPLOYMENT

Easiest free options:

| Host | Steps |
|---|---|
| **Cloudflare Pages** | Connect GitHub → deploy. Free + global CDN |
| **Netlify** | Drag-and-drop the `voicegen/` folder |
| **Vercel** | Import GitHub repo → done |
| **GitHub Pages** | Push to GitHub → enable Pages |

For backend (TTS proxy), deploy on:
- **Cloudflare Workers** (recommended, very fast)
- **Vercel / Netlify Functions** (free tier)
- **Railway / Render** (Node servers)

---

# ✅ CHECKLIST BEFORE GOING LIVE

- [ ] Replace `ca-pub-XXX` placeholders with real AdSense ID
- [ ] Insert real ElevenLabs / OpenAI API key (in backend!)
- [ ] Update `privacy@voxai.example` and contact emails
- [ ] Replace `#` affiliate links with your real referral URLs
- [ ] Add real OG/Twitter meta tags
- [ ] Add Google Analytics or Plausible
- [ ] Set up Stripe payment links
- [ ] Submit sitemap to Google Search Console
- [ ] Write 10+ blog articles for SEO traffic
- [ ] Test on mobile devices
- [ ] Test slow 3G connections

---

# 📈 GROWTH TIPS (from the spec)

1. **SEO first** — your blog is the long-term traffic engine. Target keywords like:
   - "best ai voice generator"
   - "free text to speech"
   - "tiktok voice generator"
   - "youtube ai voiceover"
2. **Free tier hooks users in** — keep 5 credits/day generous
3. **Rewarded ads = highest RPM** for tool users
4. **Affiliate links = highest ROI** for blog readers
5. **Premium = scalable income** — push Creator plan for monetizers

Target English-speaking markets first (US/UK/Canada/Australia) → highest CPMs.

---

Built with ❤️ for your client. Good luck with the launch!
