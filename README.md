# Derek & Apple Photography

A polished single-page marketing website for **Derek & Apple Photography**, a husband-and-wife photography team specializing in weddings, engagements, and family portraits.

This is a pure static site — **no framework, no build step, no npm install** — deployed to Cloudflare Pages with a Pages Function handling the contact form via MailChannels.

---

## Stack

- Vanilla HTML / CSS / JavaScript
- [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) + [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts)
- [Cloudflare Pages](https://pages.cloudflare.com/) (hosting)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) (contact form handler)
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
│       ├── gallery/              ← 9 slots for real photos (01.jpg–09.jpg)
│       └── about/
│           └── derek-apple.jpg   ← couple photo (placeholder)
├── functions/
│   └── api/
│       └── contact.js            ← Cloudflare Pages Function (form handler)
├── _redirects                    ← (optional) Cloudflare Pages redirect rules
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

> ⚠️ The contact form **will not work locally** — the `/api/contact` Pages Function only runs on Cloudflare Pages. To test the form end-to-end, push a commit and let Cloudflare Pages deploy a preview build, or run `wrangler pages dev` locally with the Cloudflare CLI.

---

## Deploying to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare Dashboard → **Pages** → **Create a project** → **Connect to Git**.
3. Select the `derek-apple-photography` repo.
4. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (root)
5. **Save and Deploy.** Cloudflare serves `index.html` from the root and auto-detects `functions/` for Pages Functions.
6. Custom domain: Cloudflare Dashboard → Pages project → **Custom domains** → add the client's domain. (Nameservers must be pointed to Cloudflare first — see **DNS setup** below.)

---

## Replacing placeholders before launch

The current site has placeholder content in several places. Swap these out as the client provides real assets:

### Logo
- File: `assets/logo/logo.png` (already in place)
- Referenced in: nav `<img>` (line ~17 of `index.html`) and hero `<img class="hero-logo">` (line ~117)
- If a higher-quality `.svg` is provided, drop it at `assets/logo/logo.svg` and update both `<img>` `src` attributes.

### Gallery photos
- 9 slots, in `index.html` inside `<section class="gallery-section">`.
- Each slot is currently a `<div class="gallery-ph ph-tall|ph-wide|ph-square|ph-cinema">` with a camera-icon placeholder.
- To swap: replace each `<div class="gallery-ph ...">…</div>` with `<img src="assets/images/gallery/01.jpg" class="gallery-ph ph-tall" alt="..." loading="lazy">`.
- Keep the aspect-ratio class (`ph-tall`, `ph-wide`, `ph-square`, `ph-cinema`) on the `<img>` so the layout stays intact.
- Compress photos to ≤300 KB each.

### About photo
- File: `assets/images/about/derek-apple.jpg`
- In `index.html` inside `<section class="about-section">`, replace the `<div class="about-img reveal">…</div>` block with `<img class="about-img reveal" src="assets/images/about/derek-apple.jpg" alt="Derek and Apple">`.

### Copy
- All copy (about bio, service descriptions, headlines) is placeholder text. Edit directly in `index.html`. Derek & Apple need to approve before launch.

### Form notification email

**Production state:**
- **Notifications to:** `booking@derekandapple.com`
- **Sender:** `noreply@derekandapple.com` (verified domain in Resend)
- **Reply-To:** the visitor's submitted email — clicking Reply in Gmail goes straight back to them

The Resend API key is stored as a Cloudflare Pages secret named `RESEND_API_KEY` (Settings → Variables and Secrets → Production environment). Never commit this key.

---

## DNS setup — Resend verification for derekandapple.com

**Status: ✅ Verified** (production). This section is documentation for future reference.

Resend's modern setup uses a **`send.derekandapple.com`** subdomain for its sending infrastructure, which means the existing Google Workspace SPF record at the root domain (`@`) is **never touched**. No merging is required — Resend's records and Google's records coexist on different hostnames.

### Records added in Cloudflare DNS

| Type | Name | Content | Priority | Purpose |
|---|---|---|---|---|
| TXT | `resend._domainkey` | `p=…` (Resend's DKIM public key) | — | Signs outgoing mail so recipients verify it's authentic |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — | SPF for the sending subdomain; authorizes Resend's AWS SES sending servers |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 | Bounce-handling — failed deliveries route back to Resend's dashboard |

### What stays untouched

The existing **Google Workspace** records remain in place and unmodified:
- The root `@` SPF TXT — still `v=spf1 include:_spf.google.com ~all`
- All Google MX records routing `derek@`, `booking@`, etc. to Gmail
- Any existing DMARC record (we did **not** add Resend's optional DMARC; if needed later, ensure only one `_dmarc` TXT exists)

### What we deliberately did NOT enable

**"Enable Receiving"** in Resend — that would replace Google's root MX records with Resend's inbound-only servers, breaking Gmail delivery for everyone. The contact form only sends; incoming mail to `@derekandapple.com` is Google Workspace's job.

---

## Pre-launch checklist

- [x] Contact form wired through Resend (`functions/api/contact.js`)
- [x] Resend API key stored as `RESEND_API_KEY` secret on Cloudflare Pages
- [x] Nameservers for `derekandapple.com` moved to Cloudflare
- [x] `derekandapple.com` verified in Resend (DKIM + SPF + bounce MX on `send` subdomain)
- [x] Production addresses live: `noreply@derekandapple.com` → `booking@derekandapple.com`
- [ ] Confirm `booking@derekandapple.com` mailbox exists in Google Workspace and is read regularly
- [ ] End-to-end test from the live form (submit and confirm receipt at `booking@`)
- [ ] Swap 9 gallery placeholder divs with real `<img>` tags
- [ ] Swap about-section placeholder with real Derek & Apple photo
- [ ] Compress all photos to ≤300 KB
- [ ] Add `loading="lazy"` to gallery images
- [ ] Verify responsive layouts against `derek-apple-mockups/` (mobile + tablet)
- [ ] Test contact form on a deployed preview build (form does not work locally)
- [ ] Confirm Cloudflare Pages email notification routes to the client's inbox

---

## Transferring the repo to the client

When Derek & Apple are ready to take ownership:

1. GitHub repo → **Settings** → **General** → **Transfer ownership**
2. Enter the client's GitHub username and confirm
3. The Cloudflare Pages project stays linked to the repo after transfer, but the client should also be added to the Cloudflare account (or the project should be re-linked to their own Cloudflare account)

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
