# Derek & Apple Photography

A polished single-page marketing website for **Derek & Apple Photography**, a husband-and-wife photography team specializing in weddings, engagements, and family portraits.

This is a pure static site — **no framework, no build step, no npm install** — deployed to Cloudflare Pages with a Pages Function handling the contact form via MailChannels.

---

## Stack

- Vanilla HTML / CSS / JavaScript
- [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) + [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts)
- [Cloudflare Pages](https://pages.cloudflare.com/) (hosting)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) (contact form handler)
- [MailChannels](https://mailchannels.com/) (free email delivery, native to Cloudflare Workers)

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
The contact form now ships with the real addresses wired in (`functions/api/contact.js`):
- **Notifications to:** `booking@derekandapple.com`
- **Sender (From / SPF):** `noreply@derekandapple.com`

Both inboxes must exist on the client's mail provider (Google Workspace) before the form goes live, or notifications will bounce.

---

## DNS setup — MailChannels SPF record

The contact form sends email through MailChannels, which requires an SPF record authorizing it on the client's domain.

The client uses **Google Workspace**, so a Google SPF record already exists. **Merge** MailChannels into it — do not create a second SPF record or email delivery breaks.

### Steps (after nameservers are pointed to Cloudflare)

1. Cloudflare Dashboard → select domain → **DNS** → **Records**.
2. Find the existing TXT record at `@` starting with `v=spf1` — it will look like:
   ```
   v=spf1 include:_spf.google.com ~all
   ```
3. Edit it to:
   ```
   v=spf1 include:_spf.google.com include:relay.mailchannels.net ~all
   ```
4. Save.

### What each part does

| Part | What it does |
|---|---|
| `v=spf1` | Declares this as an SPF record |
| `include:_spf.google.com` | Authorizes Google Workspace to send |
| `include:relay.mailchannels.net` | Authorizes MailChannels (used by this site's contact form) |
| `~all` | Soft fail — unauthorized senders are flagged but not rejected |

---

## Pre-launch checklist

- [x] Notification email (`booking@derekandapple.com`) wired into `functions/api/contact.js`
- [x] Sender address (`noreply@derekandapple.com`) wired into `functions/api/contact.js`
- [ ] Confirm both mailboxes exist in the client's Google Workspace
- [ ] Add MailChannels to SPF record in Cloudflare DNS (see above)
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
