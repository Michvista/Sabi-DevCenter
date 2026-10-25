# Sabi technical guide

Sabi (from Nigerian Pidgin and everyday usage, *sabi* means “to know,” “understand,” or “be wise”) is a maternal-health companion for pregnant people and their care teams in Nigeria. It supports the weeks between antenatal visits with week-specific education, symptom safety guidance, Nigerian and West African food references, meal planning, and consent-based midwife oversight. It is educational and does not diagnose or replace professional antenatal care.

## Try the live app

- Web app: <https://sabi-web.rumptycloud.app/>
- API health check: <https://sabi-api.rumptycloud.app/health>
- Source repository: <https://github.com/Michvista/Sabi-DevCenter>

The sign-in pages provide synthetic judge demo accounts. Use the demo sign-in option shown in the portal; demo records are fictional.

## Main user flows

### Pregnant person

1. Open the pregnancy portal and sign in or create an account.
2. Save a due date to see the current gestational week and relevant stored guidance.
3. Explore the food directory, log meals or check-ins, and create a weekly meal plan or grocery list.
4. Use symptom guidance for educational triage. For urgent symptoms, seek emergency care; Sabi is not an emergency-monitoring service.
5. Generate a care-team code and approve a midwife link only when you choose to share records.

### Midwife or care team

1. Sign in through the separate care-team portal.
2. Connect to a patient only after the patient shares and approves the pairing code.
3. Review consented check-ins, follow-up flags, and messages; send guidance through the care channel.

## Architecture

This repository is an npm workspace with independently deployable applications:

- `apps/web`: SvelteKit, Svelte, TypeScript, Tailwind CSS, and Hugeicons. It contains the public landing page, separate role-specific sign-in flows, and the responsive pregnant-person and midwife portals.
- `apps/api`: NestJS REST API, TypeScript, validation, and TypeORM. Features are grouped into controllers, services, and database entities.
- Rumpty managed PostgreSQL stores accounts, pregnancy records, check-ins, meal logs, meal plans, grocery lists, care links, and messages. Rumpty Redis supports background jobs where configured.
- Pregnancy-week content is prepared and cited ahead of time; normal page views read stored content and do not regenerate it with an LLM.
- Food references combine the project’s Nigerian-food catalogue, FAO/INFOODS Western Africa food-composition data, and measured Nigerian dish research. External FatSecret results are optional and depend on provider IP allowlisting.
- Translation and voice are server-side integrations. Provider credentials remain in API environment variables and must never be exposed as `VITE_` variables or committed to Git.

## Run locally

Requirements: Node.js 22 or newer and npm.

```powershell
git clone https://github.com/Michvista/Sabi-DevCenter.git
cd Sabi-DevCenter
npm ci
Copy-Item .env.example .env
```

Set the required local database and authentication settings in `.env`. Keep real credentials in your local environment only. Then run both workspaces:

```powershell
npm run dev
```

The web app defaults to `http://localhost:5173` and the API to `http://localhost:8080`. For separate terminals, use `npm run dev:web` and `npm run dev:api`.

## Deploy on Rumpty Cloud

Create two Web Service/Backend deployments from the repository’s `main` branch. Keep secrets in each deployment’s server-side environment settings, never in Git or frontend `VITE_` variables.

### API deployment

- Build: `npm ci && npm run build --workspace @sabi/api`
- Start: `npm --workspace @sabi/api run start:prod`
- Port: `8080`
- Health/readiness path: `/health`
- Configure the Rumpty PostgreSQL connection and CA, a strong `AUTH_JWT_SECRET`, and `WEB_ORIGIN` set to the exact web deployment URL.
- Configure optional provider and Redis settings only when those services are enabled. Provider secrets belong only in this API deployment.

### Web deployment

- Build: `npm ci && npm run build --workspace @sabi/web`
- Start: `npm --workspace @sabi/web run start`
- Port: `3000`
- Health/readiness path: `/`
- Build variable: `VITE_API_URL=https://sabi-api.rumptycloud.app`

Deploy the API before the web app, then set the API’s `WEB_ORIGIN` to the final web URL and redeploy the API. Verify the web URL, `/health`, demo sign-in, and an authenticated records request after deployment.

## Quality checks

From the repository root:

```powershell
npm run check
npm test
npm run build
```

See the repository README for project background and additional source references: <https://github.com/Michvista/Sabi-DevCenter/blob/main/README.md>.
