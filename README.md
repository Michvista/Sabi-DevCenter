# Sabi

Sabi is a Nigeria-focused pregnancy companion for the time between antenatal visits. The public landing page leads to separate, responsive pregnant-person and nurse/midwife portals.

## Current product scope

- Separate sign-in and dashboard routes for pregnant people and midwives; the pregnant portal has distinct Today, My pregnancy, Learn and My midwife sections.
- Email/password registration and sign-in, hashed passwords, signed sessions, role checks, and an invitation code for midwife account creation.
- Patient-owned pregnancy due date, mood check-ins and meal records stored in Rumpty PostgreSQL through TypeORM migrations.
- Consent-based care links: patients request a connection, a midwife approves it, and only active linked patients appear in the care-team list.
- Micronutrient values only (for example iron, calcium, folate and vitamin C) for measured FAO/INFOODS foods, study recipes, eligible FatSecret records and packaged-food labels. Calories and macronutrients are not shown or stored by food search/portion calculations.
- A user-authored weekly meal planner, preference-filtered seven-day Nigerian meal ideas, a measured-ingredient recipe estimator and editable grocery list. Meal ideas use region, budget, vegetarian preference and excluded ingredient text. They are not clinically prescribed, and recipe estimates include only measured database matches for user-entered ingredient weights.
- Opt-in browser push reminders: a general check-in reminder on Mondays and a reminder the day before a saved antenatal appointment, scheduled for 9am Lagos time. The settings card includes a user-triggered test notification. Notifications contain no symptoms or personal health data.
- Packaged-food barcode lookup using Open Food Facts, with a camera scanner on browsers that implement `BarcodeDetector` and a manual barcode fallback. Community product coverage is variable; check package labels.
- A nurse/midwife content-review queue that records week-level approval or change requests and notes. Care-team accounts are invite-gated, but Sabi does not verify professional credentials; this audit trail is not proof of clinical review.
- Safety-first symptom assessment; education only, never diagnosis or medication clearance.
- YarnGPT speech for Hausa, Igbo and Yorùbá; 9jaLingo Pidgin speech; Azure Nigerian English fallback; Groq text translations on explicit request; FatSecret nutrition search; and Rumpty inference, Redis/BullMQ and S3-compatible storage integrations. All keys stay server-side. Weekly source excerpts are retrieved from the seeded PostgreSQL book index; translation runs only after the user asks and is cached in the browser and API memory.

### Pregnancy book notice

The user confirms they have rights to use the supplied edition of Curtis & Schuler's _Your Pregnancy Week by Week_. The site contains original, precomputed summaries of the relevant chapter for weeks 1–40, with per-section PDF page citations. The source is credited and the summaries require qualified maternity-care review before use as health guidance. The app does not replace antenatal care.

## Food data, calculations and limits

The workbook `WAFCT_2019.xlsx` is ignored by Git. The extraction script creates an attributed, compact JSON catalogue under `apps/api/src/data` from the FAO/INFOODS Western Africa Food Composition Table 2019. This JSON catalogue is the food reference-data seed used by search and portion calculations. It uses numeric nutrient fields and preserves food codes and source references. Values are per 100 g edible portion; the table covers multiple West African countries, so a match is not automatically a specifically Nigerian recipe. These values describe foods; they are not pregnancy-specific dietary recommendations.

The supplied `Nigerian Foods.csv`/Kaggle catalogue provides dish names, ingredients, descriptions and regional context. It does **not** provide measured nutrient composition. The app includes per-100 g measured study-recipe values for egusi soup, jollof rice and jollof rice with beans, transcribed from Ayogu et al. (2017). These are research samples, not universal recipes; actual composition varies with ingredients and cooking. Eba and moi moi still have no measured dish-level values in this catalogue. FatSecret OAuth currently succeeds from the local development environment; Rumpty's outbound IP still needs its own allowlist check. Its serving basis is shown and may not match a home recipe. The recipe estimator can total sourced micronutrients from user-entered ingredient quantities, but it does not model cooking yield or estimate unmatched ingredients. No energy or macronutrient totals are displayed, and the app does not prescribe an individual's diet.

Open Food Facts is used only for barcode-based packaged-food lookup; its product, ingredients and label nutrient fields may be missing or community-contributed. Edamam is not used. Barcode matching is not NAFDAC registration verification.

Sources:

- [FAO/INFOODS Western Africa food tables](https://www.fao.org/infoods/infoods/tables-and-databases/africa/en/) — reference nutrient composition.
- [FAO WAFCT 2019 record](https://www.fao.org/food-composition/tables-and-databases/detail/food-composition-tables/en) — source workbook information.
- [Ayogu et al. (2017), Commonly Consumed Foods](https://journals.sagepub.com/doi/10.1177/0379572116689627) — measured per-100 g nutrient composition for studied Nigerian foods, including egusi soup and jollof rice; study-recipe values vary by preparation.
- [WHO antenatal care recommendations](https://www.who.int/publications/i/item/9789241549912/) — broad antenatal nutrition guidance; not a source for Sabi's week-by-week prompts or individualized targets.
- [FatSecret Platform API](https://platform.fatsecret.com/docs/guides/authentication/oauth2) — optional OAuth food lookup, server-side only.
- [Open Food Facts product-by-barcode API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/v2/products/get-product-by-code/) — community product lookup; Sabi normalizes only per-100 g micronutrient label values.
- [YarnGPT API](https://www.yarngpt.ai/api-docs) — translated speech for Hausa, Igbo and Yoruba. The current API language list does not include Nigerian Pidgin.
- [9jaLingo API](https://www.9jalingo.org/api-documentation) — Pidgin text-to-speech after on-screen text translation.
- The Kaggle CSV and copyrighted pregnancy-book PDF were supplied inside this project; their original public URLs/licensing are not included here.

The week-by-week guide pipeline is development-time preprocessing. Run `npm run rag:extract-weeks` to extract selected passages about baby size, development and changes in the pregnant person from the 40 relevant chapter sections, each with its exact PDF page citation. The passages are written to `apps/web/src/lib/data/pregnancy-week-book-notes.json`; source pages are kept only in ignored `tmp/pdfs`. `npm run rag:embed-book` creates a `gemini-embedding-001` embedding per prepared weekly note and writes `apps/api/src/data/pregnancy-week-book-index.json`. The API seed compares the bundled guide content with Rumpty PostgreSQL and inserts or refreshes rows only when the content changes. Opening or refreshing a guide makes no Gemini call. The API looks up the exact week number in PostgreSQL; embeddings are stored but the current week endpoint does not perform vector-similarity retrieval. Weeks 41–42 use original prompts and are not presented as book-derived. Book passages are paired with static, current WHO antenatal-care and nutrition references; none of this content is clinician-reviewed or a complete clinical protocol.

Each week page also includes a static antenatal-care focus based on current WHO recommendations, with a source link and a reminder that local clinicians set the individual schedule. These reminders are prebuilt site content and do not trigger AI requests.

## Stack and file layout

- `apps/web`: SvelteKit, Svelte 5, TypeScript, Hugeicons, DM Sans and Fraunces from Google Fonts. Routes live under `src/routes`; reusable UI, account helpers and data modules are separated under `src/lib`.
- `apps/api`: NestJS modules/controllers, auth and role guards, TypeORM entities/migrations, and provider adapters.
- `apps/api/scripts/extract-wafct.py`: read-only workbook-to-JSON extraction helper (requires Python and `openpyxl` when rebuilding the derived food catalogue).
- `apps/api/src/data`: derived FAO food data and the supplied dish catalogue copied to the build output.

## Local setup

Requirements: Node.js 22.17+ and npm.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Set `DATABASE_URL` and `RUMPTY_POSTGRES_CA_CERT` before creating accounts or saving health records. The initial schema is applied with TypeORM migrations at API startup; the book index seeds once when the table is empty. You can also run:

```powershell
npm --workspace @sabi/api run db:migrate
```

### Judge demo account

The pregnant-person sign-in screen has a one-click judge demo. Its public credentials are `demo.pregnant@sabi.health` / `SabiDemo2026!`. The demo account contains synthetic pregnancy, check-in, meal and grocery examples only. Seed it after the Rumpty database is reachable:

```powershell
npm run db:seed-demo
```

This command applies pending migrations and idempotently creates or refreshes the demo account. It adds sample records only when that demo account has no corresponding records. `VITE_DEMO_LOGIN_ENABLED`, `VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD` control the public sign-in card; `SABI_DEMO_EMAIL` and `SABI_DEMO_PASSWORD` control the server-side seed. Keep the two pairs identical. These credentials are intentionally public and must only be used for the synthetic judge account, never for a real person.

Set `AUTH_JWT_SECRET` to at least 32 random characters and `MIDWIFE_INVITE_CODE` to a private invitation code before creating a midwife account. Browser reminder keys are `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY` and `WEB_PUSH_SUBJECT`; the private key must only be configured on the API server. Do not expose service credentials using a `VITE_` variable.

The API returns HTTP 200 from `GET /` and `GET /health` for deployment health checks. The web app runs on port 5173 and API on 8080 by default.

## Checks

```powershell
npm test
npm run check
npm run build
npm run format:check
```

Clinical content requires review by qualified Nigerian maternity-care clinicians before real-world use. The app does not monitor emergencies; urgent symptoms need immediate local clinical care.

## Rumpty deployment

- Use the Rumpty internal PostgreSQL and Redis URLs when the services and app are in the same Rumpty workspace; use public URLs for local development where appropriate.
- Keep both database and Redis CA certificates in private environment settings or outside the repository. TLS verification stays enabled.
- Store the database, Redis, S3 and inference credentials in Rumpty's encrypted deployment environment variables. The platform API token is not a substitute for service credentials.
- Deploy the API and web app as separate Node deployments. Configure `VITE_API_URL` on the web deployment and `WEB_ORIGIN` on the API.
- Keep health logs, demo accounts and test data free of real identifiable patient details.
