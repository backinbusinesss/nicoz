# Nicoz — Portfolio + Services Catalog

Static site (HTML/CSS/JS) published on GitHub Pages:
**https://backinbusinesss.github.io/nicoz/**

## Pages

| File            | What it is                                                       |
|-----------------|------------------------------------------------------------------|
| `index.html`    | Portfolio (home)                                                 |
| `catalogo.html` | Services catalog: 12 products (4 categories: Website / Discord / Telegram / App) + 5 bundles, rendered from JSON |
| `build.html`    | "Build your idea" — 3-step request wizard                        |
| `termini.html`  | Terms & conditions                                               |
| `cookie.html`   | Cookie policy + privacy preferences                              |

Every page (except the wizard itself) shows a floating **“Build your idea”**
button (`js/fab.js` → `css/catalog.css`).

## Editing products & prices

Everything lives in **one place**:

- **`products.json`** — the 12 products (name, emoji, price, billing, category,
  tagline, description, includes, delivery, optional upsell) + site contacts
  (email / WhatsApp number used by all WhatsApp links).
- **`bundles.json`** — the 5 bundles. Each bundle lists product `slugs`;
  the total value and the “Save $X” badge are computed automatically.

Rules:

- Changing a price in `products.json` updates the catalog page and the wizard
  estimate instantly (no code changes needed).
- The `category` field (`website` / `discord` / `telegram` / `app`) drives the
  catalog filter tabs — counts are computed automatically.
- Keep `bundles.json` prices in sync manually when you change product prices
  (the delta is shown as the discount).
- The `tagline` field is the 2-line description meant for the
  **WhatsApp Business catalog preview**.

## Contact details

Stored in `products.json` under `contact`:

```json
"contact": {
  "email": "nicoz@secria.me",
  "whatsapp": "18734741519",
  "whatsappDisplay": "+1 (873) 474-1519"
}
```

`whatsapp` must be digits only (country code included, no `+`, no spaces) —
it is what powers all `wa.me` links. The display version is used in text.

## WhatsApp Business catalog export

When you fill the catalog inside the WhatsApp Business app, use
`products.json` as the source:

- **Name** → `name`
- **Price** → `price` (append `/month` for `billing: monthly`)
- **Short description** → `tagline`
- **Long description** → `description`
- **Delivery** → `delivery`

## Local preview

Any static server works (forms/JSON need HTTP, not `file://`):

```bash
python -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000/catalogo.html`.
(GitHub Pages also serves the pages without the `.html` extension — the site
links use clean URLs like `/catalogo`.)

## Deploy

Push to `main` — GitHub Pages publishes automatically.

## Future: real backend

`js/build.js` has an `API_BASE` hook: when a backend exists, the wizard POSTs
the request there (saving it server-side with a server-assigned
`#IDEA-XXXX` reference) and gracefully falls back to the WhatsApp flow if the
API is unreachable.


## Languages (EN default + Italian switch)

- Default language: **English**. The EN | IT pill (nav + mobile menu) switches
  language live; the choice is saved in localStorage (
icoz-lang).
- js/i18n.js holds the IT translations of all static UI texts, keyed by CSS
  selector, as [EN, IT] pairs. It also injects the switch pill � no HTML
  changes needed when adding pages: just load the script and it works.
- Dynamic content follows window.NicozI18N.lang:
  - products.json / undles.json: each product/bundle can have an optional
    it block (
ame, 	agline, description, includes, upsell) used on
    the Italian site; missing fields fall back to English.
  - js/catalog.js / js/build.js: labels, badges, validation and the
    pre-filled WhatsApp message re-render in the active language (event
    
icoz:lang).
- The legal pages (	ermini.html, cookie.html) are Italian-only by design
  and do not load i18n.js.
- The site icon lives in img/ (avicon-32.png, pple-touch-icon.png,
  og-icon.png), generated from the original PNG in Downloads. Regenerate
  with any square image + a 32 / 180 / 512 resize.
