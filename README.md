# Derek & Apple Photography

A polished single-page marketing website for **Derek & Apple Photography**, a husband-and-wife photography team specializing in weddings, engagements, and family portraits.

This is a pure static site — **no framework, no build step, no npm install** — deployed with Cloudflare Workers static assets and a Worker route handling the contact form via Resend.

---

## Stack

- Vanilla HTML / CSS / JavaScript
- [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) + [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts)
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) (hosting)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) (contact form handler)
- [Resend](https://resend.com/) (transactional email — 3,000/month free tier)

---

## File structure

```
derek-apple-photography/
├── index.html
├── success.html                  ← form submission redirect page
├── css/
│   └── style.css
├── js/
│   └── main.js
├── assets/
│   ├── logo/
│   │   └── logo.png              ← brand logo
│   └── images/
│       ├── featured/             ← 6 slots for hero slideshow (1.jpg–6.jpg)
│       ├── weddings/             ← 8 slots for wedding gallery (1.jpg–8.jpg)
│       ├── family/               ← 8 slots for family gallery (1.jpg–8.jpg)
│       ├── engagements/          ← 8 slots for engagement gallery (1.jpg–8.jpg)
│       └── about/
│           └── derek-apple.jpg   ← couple photo (placeholder)
├── src/
│   └── index.js                  ← Cloudflare Worker (static assets + /api/contact)
├── wrangler.toml                 ← Worker + static assets deployment config
├── .assetsignore                 ← excludes non-public files from static asset upload
├── _redirects                    ← (optional) Cloudflare redirect rules
└── README.md
```

---

## Running locally

No build step. Just open `index.html` in a browser, or serve the folder with any static server:

```bash
# Python (one-liner)
python -m http.server 8000

# Node
npx --yes serve .

# VS Code Live Server extension
# right-click index.html → Open with Live Server
```

> ⚠️ The contact form **will not work from a plain static file server** — the `/api/contact` route is handled by the Cloudflare Worker. To test end-to-end locally, run `wrangler dev`.

---

## Deploying to Cloudflare

1. Push this repo to GitHub.
2. Cloudflare Dashboard → create or open the Worker project linked to this repo.
3. Ensure deployment uses the checked-in `/home/runner/work/derek-apple-photography/derek-apple-photography/wrangler.toml`.
4. The Worker entrypoint is `/home/runner/work/derek-apple-photography/derek-apple-photography/src/index.js`.
5. Static assets are uploaded from the repo root via `[assets] directory = "."`; `/api/contact` is handled by the Worker and all other requests fall through to `env.ASSETS.fetch(request)`.
6. Add `RESEND_API_KEY` as a Worker secret/binding in Cloudflare before deploying.
7. Custom domain: Cloudflare Dashboard → project → **Domains / Custom domains** → add the client's domain. (Nameservers must be pointed to Cloudflare first — see **DNS setup** below.)

---

## Replacing placeholders before launch

The current site has placeholder content in several places. Swap these out as the client provides real assets:

### Logo
- File: `assets/logo/logo.png` (already in place)
- Referenced in: nav `<img>` (line ~17 of `index.html`) and hero `<img class="hero-logo">` (line ~117)
- If a higher-quality `.svg` is provided, drop it at `assets/logo/logo.svg` and update both `<img>` `src` attributes.

### Gallery photos

The site has **two galleries**, both placeholder-driven — you don't need to touch HTML, just drop files at the expected paths.

**1. Featured slideshow (`#featured`):** auto-cycling, 6 slots.
- Drop files at `assets/images/featured/1.jpg` through `6.jpg`.
- Recommended: 16:9 landscape, ≥1600px wide, ~200–400 KB each.
- Missing files show the cream placeholder pattern; the cycle still runs over whatever's there.

**2. Categorized gallery (`#gallery`):** 3 tabs — Weddings, Family, Engagements — 8 slots each.
- Drop files at:
  - `assets/images/weddings/1.jpg` through `8.jpg`
  - `assets/images/family/1.jpg` through `8.jpg`
  - `assets/images/engagements/1.jpg` through `8.jpg`
- Recommended: 4:5 portrait, ≥1000px wide, ~150–300 KB each.

**To add more than 8 per category:** edit `index.html`, copy one of the `<div class="cat-item">…</div>` blocks inside the relevant `.cat-panel`, and increment the filename (e.g. `9.jpg`, `10.jpg`).

### About photo
- File: `assets/images/about/derek-apple.jpg`
- Currently the about column shows a **brand panel** (circular logo + "Husband · Wife · Camera" tagline) as a designed stand-in so the section doesn't look unfinished.
- In `index.html` inside `<section class="about-section">`, replace the entire `<div class="about-brand reveal">…</div>` block with `<img class="about-img reveal" src="assets/images/about/derek-apple.jpg" alt="Derek and Apple">`.
- The `.about-img` CSS already exists and is sized 4:5 portrait to match the new image automatically.

### Copy
- All copy (about bio, service descriptions, headlines) is placeholder text. Edit directly in `index.html`. Derek & Apple need to approve before launch.

### Form notification email

**Production state:**
- **Notifications to:** `booking@derekandapple.com`
- **Sender:** `noreply@derekandapple.com` (verified domain in Resend)
- **Reply-To:** the visitor's submitted email — clicking Reply in Gmail goes straight back to them

The Resend API key is stored as a Cloudflare Worker secret named `RESEND_API_KEY`. Never commit this key.

---

## DNS setup — Resend verification for derekandapple.com

**Stack:**
- Registrar: **Porkbun** (Porkbun nameservers delegated to Cloudflare: `adrian.ns.cloudflare.com` + `ernest.ns.cloudflare.com`)
- DNS host: **Cloudflare** (all records live here)
- Mail: **Zoho Mail**
- Hosting: **Cloudflare**

Resend's modern setup uses a **`send.derekandapple.com`** subdomain for its sending infrastructure, which means the existing Zoho Mail SPF record at the root domain (`@`) is **never touched**. No merging is required — Resend's records and Zoho's records coexist on different hostnames.

### Records that must exist in Cloudflare DNS

**Resend (outbound transactional mail — required for the contact form):**

| Type | Name | Content | Priority | Purpose |
|---|---|---|---|---|
| TXT | `resend._domainkey` | `p=…` (Resend's DKIM public key — copy from Resend's domain page) | — | Signs outgoing mail so recipients verify it's authentic |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — | SPF for the sending subdomain; authorizes Resend's AWS SES sending servers |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 | Bounce handling — failed deliveries route back to Resend's dashboard |

**Zoho Mail (inbound mail to booking@, derek@, etc. — must stay intact):**

| Type | Name | Content | Priority | Purpose |
|---|---|---|---|---|
| MX | `@` | `mx.zoho.com` | 10 | Primary inbound mail server |
| MX | `@` | `mx2.zoho.com` | 20 | Secondary inbound |
| MX | `@` | `mx3.zoho.com` | 50 | Tertiary inbound |
| TXT | `@` | `v=spf1 include:zoho.com ~all` | — | SPF authorizing Zoho to send mail FROM the domain |
| TXT | `zmail._domainkey` (or similar) | `v=DKIM1; k=rsa; p=…` (from Zoho admin → Domains → DKIM) | — | Zoho's DKIM key |

> Get the exact Zoho values from **Zoho Mail Admin Console → Domains → derekandapple.com**. The DKIM selector and SPF include line may differ if Derek & Apple's Zoho account is on a non-US datacenter (e.g. `zoho.eu`, `zoho.in`).

**Cloudflare (the site itself):**

| Type | Name | Content | Proxy | Notes |
|---|---|---|---|---|
| CNAME | `@` | `derek-apple-photography.pages.dev` | Proxied | Apex. Cloudflare CNAME-flattening handles the "CNAME at apex" case automatically. |
| CNAME | `www` | `derek-apple-photography.pages.dev` | Proxied | Subdomain version. |

> When you add a custom domain in the Cloudflare dashboard, Cloudflare usually auto-creates the matching CNAME for you. If only one of these two records exists, add the other manually — otherwise only one URL works.

### What we deliberately did NOT enable

**"Enable Receiving"** in Resend — that would replace Zoho's root MX records with Resend's inbound-only servers, breaking incoming mail entirely. The contact form only sends; incoming mail to `@derekandapple.com` is Zoho's job.

**A second SPF record** — there can only be one TXT record at `@` starting with `v=spf1`. Zoho's lives there. Resend's SPF lives on the `send` subdomain, so they never collide.

---

## Pre-launch checklist

- [x] Contact form wired through Resend (`src/index.js`)
- [x] Resend API key stored as `RESEND_API_KEY` secret on Cloudflare
- [x] Production addresses live in code: `noreply@derekandapple.com` → `booking@derekandapple.com`
- [x] `derekandapple.com` registered at Porkbun; nameservers delegated to Cloudflare (`adrian` + `ernest`)
- [x] Zoho Mail records in Cloudflare DNS (MX, SPF, DKIM)
- [x] Resend records in Cloudflare DNS (DKIM TXT, `send` SPF TXT, `send` MX); domain verified in Resend
- [x] Cloudflare custom domain bound to `derekandapple.com`
- [ ] Confirm both CNAMEs exist in Cloudflare DNS: `@` and `www` → `derek-apple-photography.pages.dev` (proxied)
- [ ] End-to-end test from the live `derekandapple.com` form (submit + confirm receipt at `booking@`)
- [ ] Drop 6 featured slideshow photos at `assets/images/featured/1.jpg`–`6.jpg`
- [ ] Drop 8 wedding photos at `assets/images/weddings/1.jpg`–`8.jpg`
- [ ] Drop 8 family photos at `assets/images/family/1.jpg`–`8.jpg`
- [ ] Drop 8 engagement photos at `assets/images/engagements/1.jpg`–`8.jpg`
- [ ] Swap about-section placeholder with real Derek & Apple photo
- [ ] Compress all photos (≤400 KB for featured slideshow, ≤300 KB for gallery)
- [ ] Verify responsive layouts against `derek-apple-mockups/` (mobile + tablet)
- [ ] Test contact form on a deployed build (form route requires Cloudflare Worker)
- [ ] Confirm Cloudflare email notification routes to the client's inbox

---

## Transferring the repo to the client

When Derek & Apple are ready to take ownership:

1. GitHub repo → **Settings** → **General** → **Transfer ownership**
2. Enter the client's GitHub username and confirm
3. The Cloudflare project stays linked to the repo after transfer, but the client should also be added to the Cloudflare account (or the project should be re-linked to their own Cloudflare account)

---

## Design rules (do not violate)

- `--red` (#b8312f) is used **only** for: CTA background, CTA hover, nav-underline-on-hover, hero texture color, scroll-indicator accent, divider diamond/circles. Don't bleed it elsewhere.
- Texture opacity is **13%** — not higher, not lower.
- Gallery frame variants cycle in strict nth-child order: 1,5,9 → inset rule · 2,6 → double mat · 3,7 → corner brackets · 4,8 → film-strip top/bottom.
- `--fd` (Cormorant Garamond) for headings only. `--fb` (Outfit) for everything else.
- Art Nouveau divider appears **only** under section titles — not as general decoration.
- `border-radius: 0` on all form inputs. No rounded corners on form elements.
- Hero background is `var(--surface)` (#f7f5f0), not `var(--bg)`.
- About section background is `var(--bg)`. Services and contact are `var(--surface)`.

---

## Credits

Design: Chris Johnson  
Photography: Derek & Apple Juliano  
© 2026 Derek & Apple Photography
