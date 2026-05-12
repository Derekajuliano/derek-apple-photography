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

**Current state — TESTING MODE:**
- **Notifications to:** `bchristopherjohn26@gmail.com` (Chris's personal — Resend account owner)
- **Sender:** `onboarding@resend.dev` (Resend's shared test domain)
- **Reply-To:** the visitor's submitted email
- **Workflow:** Chris receives inquiries in his Gmail and manually forwards to Derek & Apple, until the domain is verified in Resend.

**Why testing mode?** Resend's free tier requires a verified sender domain before mail can go to arbitrary recipients. From `onboarding@resend.dev`, the only legal TO is the account owner's verified email. The handoff path to flip into production is in the DNS section below.

**Production target (after Path B unlocks):**
- **Notifications to:** `booking@derekandapple.com`
- **Sender:** `noreply@derekandapple.com`

The Resend API key is stored as a Cloudflare Pages secret named `RESEND_API_KEY` (Settings → Variables and Secrets → Production environment). Never commit this key.

---

## DNS setup — verifying derekandapple.com in Resend

Until the domain is verified in Resend, the contact form sends `from: onboarding@resend.dev` (Resend's test domain). That works fine — visitors don't normally see the "From" header — but the production target is to send `from: noreply@derekandapple.com` so the email looks native.

This step requires nameservers to already point to Cloudflare (so we control DNS).

### Steps

1. **Resend Dashboard → Domains → Add Domain** → `derekandapple.com`.
2. Resend will show ~3 DNS records to add (SPF, DKIM, optional return-path MX). Copy each.
3. **Cloudflare Dashboard → derekandapple.com → DNS → Records.**
4. For each Resend record:
   - **DKIM TXT records** — add as new TXT records exactly as shown.
   - **SPF TXT record** — **DO NOT** create a new TXT record. The domain already has a Google Workspace SPF record at `@`. Edit that existing record and merge Resend's `include:`:
     ```
     Before:  v=spf1 include:_spf.google.com ~all
     After:   v=spf1 include:_spf.google.com include:_spf.resend.com ~all
     ```
     Two SPF records on the same domain breaks email delivery — always merge.
5. Back in Resend, click **Verify**. It usually takes 1–10 minutes for DNS to propagate.
6. Once Resend reports the domain **Verified**, update `FROM_ADDRESS` in `functions/api/contact.js`:
   ```js
   const FROM_ADDRESS = 'Derek & Apple Website <noreply@derekandapple.com>';
   ```
   Commit + push. Cloudflare Pages auto-deploys.

### What the records do

| Record | Purpose |
|---|---|
| SPF TXT (`include:_spf.resend.com`) | Authorizes Resend's servers to send mail as `@derekandapple.com` |
| DKIM TXT | Cryptographic signature on outgoing mail — proves the message wasn't forged in transit |
| Return-path MX (optional) | Lets bounces route back to Resend so they show up in your dashboard |

---

## Pre-launch checklist

- [x] Contact form wired through Resend (`functions/api/contact.js`)
- [x] Resend API key stored as `RESEND_API_KEY` secret on Cloudflare Pages
- [x] **Testing mode:** notifications route to `bchristopherjohn26@gmail.com` (Chris manually forwards to Derek & Apple)
- [ ] Confirm `booking@derekandapple.com` mailbox exists in Google Workspace
- [ ] Move `derekandapple.com` nameservers from Squarespace to Cloudflare (unlocks DNS control — see Path B trigger below)
- [ ] Verify `derekandapple.com` in Resend + add DNS records (see DNS setup above)
- [ ] After Resend verification, swap `TO_ADDRESS` and `FROM_ADDRESS` in `contact.js` to the production addresses
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
