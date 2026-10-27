# Lumora Christmas Lights Irvine

Vite + React site with a booking calendar (Cloudflare Worker + D1) and Stripe reservation deposits.

| Plumbing | Value |
|---|---|
| Source tag | `lumora-irvine` |
| Booking ID prefix | `LUM-` (e.g. `LUM-261029-K7Q2M`) |
| Worker | `lumora-irvine-api` |
| Pages project | `lumora-christmas-lights-irvine` |
| D1 binding name | `DB` (shared bookings schema) |
| Phone | 657-577-2597 |

## 1. Run locally (Windows CMD)

```
cd lumora-christmas-lights-irvine
copy .env.example .env.local
notepad .env.local
npm install
npm run dev
```

Set `VITE_STRIPE_PUBLISHABLE_KEY` and `VITE_API_URL` (your Worker URL, no trailing slash) in `.env.local`.

## 2. Push to GitHub (Windows CMD)

```
git init
git add .
git commit -m "Lumora Christmas Lights Irvine site"
git branch -M main
git remote add origin https://github.com/servicepros714/lumora-christmas-lights-irvine.git
git push -u origin main
```

## 3. Cloudflare dashboard setup (no CLI)

**D1** — Storage & Databases > D1. Use the shared bookings database (or create one), open **Console**, paste `worker/schema.sql`, run. It uses `IF NOT EXISTS`, so it is safe on the shared database.

**Worker** — Workers & Pages > Create > Worker named `lumora-irvine-api` > Edit code > paste all of `worker/worker.js` > Deploy.
- Settings > Bindings > Add > D1 database > variable name `DB` > choose the database.
- Settings > Variables and Secrets > add **Secret** `STRIPE_SECRET_KEY`.
- Optional secrets: `ADMIN_TOKEN` (requires `Authorization: Bearer <token>` on GET/PATCH `/api/bookings`), `ALLOWED_ORIGIN` (e.g. your live domain; defaults to `*`).
- Copy the Worker URL — that is `VITE_API_URL`.

**Pages** — Workers & Pages > Create > Pages > Direct Upload > name it `lumora-christmas-lights-irvine` (create the empty project once; the GitHub Action deploys into it).

**GitHub repo secrets** (Settings > Secrets and variables > Actions):
`CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers" or a token with Pages: Edit), `CLOUDFLARE_ACCOUNT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_API_URL`.
Every push to `main` builds and deploys. `public/_redirects` handles SPA routing.

**Stripe** — Settings > Payment methods > Payment method domains: add the live domain (and the pages.dev domain) so Apple Pay / Google Pay show in the express checkout.

## Worker API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/availability?date=YYYY-MM-DD` | Unavailable windows for that day (source-scoped, includes 48-hour lead time) |
| GET | `/api/availability?from=&to=` | Fully booked dates in a range |
| POST | `/api/create-payment-intent` | $149 PaymentIntent, `automatic_payment_methods` on. Never touches D1 |
| POST | `/api/bookings` | Inserts with `status = 'Booked'`; `payment_status` `Paid` (PI verified with Stripe) or `Pay Later` |
| GET | `/api/bookings` | Source-scoped list for the admin dashboard |
| PATCH | `/api/bookings/:id` | PATCHABLE: status, reschedule_date, reschedule_time, notes2, original_date, original_time, payment_status, date, time |

Stored values: `time` = `8AM–12PM` / `12PM–4PM` (en dash). `vehicle` = home details, e.g. `2-Story · Front & Sides · +Wreaths`. `notes` = add-ons, estimate, deposit status, draft ref and `PI: pi_…` (idempotency — the same PaymentIntent never creates two rows).

## Known recurring bugs — fixed in this build
- **ensureSchema blocking payment** — payment-intent route never calls D1; schema errors are caught and logged.
- **`.exec()` newline parsing** — no `exec()`; each statement is a single-line `prepare().run()`.
- **Nav grid mismatch** — the nav is a flex capsule, no grid columns to mismatch.
- **`.btn` background** — every variant sets its own background and resets `appearance`/border.
- **`.container` specificity** — defined once, single class, never redeclared via compound selectors.
- **ExpressCheckoutElement clientSecret** — `<Elements>` mounts only after the PaymentIntent exists, keyed on its clientSecret.
- **`strong` display bleed** — `strong, b { display: inline }` reset in base.css.

## TODO before launch
- **Prices** — set `price` in `PACKAGES` / `ADDONS` (`src/data/site.js`). Unset prices show "Online quoting".
- **Gallery** — add real night install photos to `public/gallery/` and set `src` on each `GALLERY` item. Items without `src` show a styled illustration of that lighting style.
- **Reviews** — add real Google reviews to `REVIEWS`. Until then the section shows a neutral "new this season" card.
- **Takedown wording** — confirm the FAQ answer about the takedown window.
- **Domain** — replace `lumora-christmas-lights-irvine.pages.dev` in `index.html`, `public/robots.txt`, `public/sitemap.xml`.
- **Email** — optional `BUSINESS.email` for the footer.
