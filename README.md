# Sabi — Maternal Care Close to Home

> **"You Sabi"** — In Nigerian Pidgin and everyday parlance, *Sabi* means **to know**, **to understand deeply**, and **to be wise**. 
> We named this companion **Sabi** because maternal health in Nigeria should never feel like navigating the dark. Every pregnant mother and family deserves to truly *sabi* what their body is experiencing, *sabi* what culturally familiar meals nourish their growing baby, and *sabi* exactly when a symptom needs urgent medical attention.

Sabi is a culturally rooted, evidence-guided maternal health companion designed for Nigerian families during the critical weeks between antenatal clinic appointments. It connects pregnant mothers directly with their local midwives and primary healthcare workers through a consent-governed care team portal.

---

## 💡 The Problem & Why "Sabi"?

In Nigeria, maternal mortality remains among the highest globally, driven largely by delays in recognizing danger signs, unmeasured self-medication with unstandardized herbal mixtures (*agbo*), and fragmented continuity of care between sparse clinic visits.

1. **Deep Cultural Resonance**: In Nigerian everyday lingua across all 36 states, *"I sabi"* represents confidence, clarity, and competence. Expecting mothers are often inundated with contradictory advice from well-meaning relatives, market vendors, and social media. Sabi empowers women with verified, calm, and dignified clinical education.
2. **Clinical Partnership, Not Replacement**: Sabi is designed around WHO Antenatal Care standards. Between scheduled clinic visits, mothers log how they feel, track symptoms, and communicate directly with their connected nurse or midwife.
3. **Indigenous Nutritional Intelligence**: Rather than Western food pyramids recommending kale and salmon, Sabi focuses on indigenous Nigerian staples across all geopolitical zones (Ugwu, Egusi, Tuwo, Miyan Kuka, Moi-Moi, Afang, Unripe Plantain, Ofe Onugbu, Ogi) using laboratory reference measurements from the **FAO/INFOODS Western Africa Food Composition Table (WAFCT)** and Nigerian clinical research (Ayogu et al.).

---

## 📚 Clinical Foundations & Data Sources

Every recommendation, nutrient calculation, and educational excerpt in Sabi is anchored in reputable sources:

| Category | Source / Authority | Role in Sabi |
|---|---|---|
| **Gestational Milestones** | *Your Pregnancy Week by Week* (Glade B. Curtis, OB/GYN & Judith Schuler, M.S.) | 42-week fetal development, maternal physiological changes, and clinic questions. |
| **Antenatal Standards** | World Health Organization (WHO) Guidelines on Antenatal Care for a Positive Pregnancy Experience | Screening schedules, danger sign triage criteria, and trimester care focus. |
| **West African Food Composition** | Food and Agriculture Organization (FAO) / International Network of Food Data Systems (INFOODS) WAFCT 2019 | 1,028 measured foods with verified micronutrient values (calcium, iron, vitamin C, folate, fibre). |
| **Nigerian Cooked Dishes** | Ayogu et al. (2017), *Nutrient composition of commonly consumed cooked dishes in Nigeria* (SAGE) | Lab-measured nutritional values for prepared recipes (Egusi, Jollof Rice, Rice & Beans). |
| **Global Food Database** | FatSecret Platform API (OAuth 2.0) | Multi-ingredient search, portion scaling, and branded packaging lookups. |
| **Packaged Product Barcodes** | Open Food Facts REST API | Instant camera and manual barcode scanner for packaged foods. |
| **Medication Safety** | British National Formulary (BNF) & WHO Model List of Essential Medicines for Pregnancy | Safety ratings (Safe, Caution, Avoid) for 50+ common drugs, supplements, and indigenous herbs. |

---

## 🎙️ Multilingual Voice AI Architecture

Recognizing that many expectant mothers and families across Nigeria prefer listening or speak indigenous languages, Sabi integrates a resilient voice pipeline:

```
[ Weekly Guide Text (English) ]
              │
              ▼ (Groq LLM Neural Translation)
[ Hausa / Igbo / Yorùbá / Pidgin Text ]
              │
              ├─► YarnGPT Speech Engine (Primary Indigenous Voice)
              │         │ (200 OK)
              │         ▼
              │   [ High-Fidelity Audio Stream ]
              │
              ├─► 9jaLingo TTS (Indigenous Language Fallback)
              │
              └─► Microsoft Azure Speech (en-NG-EzinneNeural Fallback)
```

- **YarnGPT**: Indigenous Nigerian voice model streaming synthesized audio with natural West African accents (featuring native Yorùbá, Hausa, and Igbo pronunciation).
- **9jaLingo TTS**: Specialized secondary synthesis engine for Nigerian Pidgin (`ada_pcm`) and indigenous dialects.
- **Azure Cognitive Speech**: High-fidelity Nigerian English neural voice (`en-NG-EzinneNeural`).
- **Offline Audio Download**: Every generated guide includes an instant `.mp3` download button so mothers can save guides to their phones without consuming mobile data repeatedly.

---

## 🌟 Core Feature Suite

### 1. For Expectant Mothers (`/pregnant/dashboard`)

- **Interactive Week-by-Week Guide**: Baby size comparison (fruits familiar to Nigerian mothers), developmental milestones, maternal body sensations, and questions for the next visit.
- **Multilingual Audio Companion**: Listen to the comprehensive weekly guide in English, Hausa, Igbo, Yorùbá, or Nigerian Pidgin.
- **Segregated Knowledge & Nutrition Hub**:
  - **Nigerian Food Directory**: Search local ingredients, view micronutrients per 100g, and scale portion grams.
  - **Food Journal**: Record meals by time of day (Breakfast, Lunch, Dinner, Snack), log measured grams, and track nutrition.
  - **7-Day Meal Planner**: Trimester-tailored timetable combos (Monday to Sunday) and an automated 7-day Nigerian meal generator with region, budget, and vegetarian filters.
  - **Market & Grocery List**: One-click export from planned meals directly into an interactive checklist with quantity tags.
  - **Recipe Nutrient Builder**: Custom home dish calculator that combines individual raw ingredients to estimate total folate, iron, calcium, and vitamin C.
  - **Medication Safety Guide**: Quick-lookup directory categorized into Safe, Caution, and Strictly Avoided (with clinical warnings against unstandardized *agbo* mixtures).
- **Pause & Notice Wellness Check-in**: Daily mood logging and symptom safety triage with Nigerian emergency contacts (112).
- **Two-Way Midwife Care Channel**: Real-time sync of check-ins and two-way messaging between the mother and her assigned midwife.
- **Web Push Reminders**: Automated VAPID push notifications scheduled every Monday at 9:00 AM Lagos time and the day before any scheduled antenatal appointment.

### 2. For Midwives & Care Teams (`/midwife/dashboard`)

- **Segregated 4-Tab Clinical Suite**:
  - **Patient Overview**: Filtered roster of connected mothers with gestational age, calculated due dates, and last check-in indicators.
  - **Priority Follow-up Queue**: Highlighted triage queue for patients reporting warning signs (severe abdominal pain, bleeding, reduced movement). Badges automatically clear once viewed.
  - **Patient Messages**: Two-way direct clinical messaging thread to answer questions and send reassurance between visits.
  - **Content Review & Audit**: Clinician review portal to verify or request revisions on weekly educational excerpts.
- **Consent-Governed Pairing**: Patients link securely using the midwife's unique Sabi connection code (e.g. `SABICRE` for demo).

---

## 🛠 Tech Stack

| Tier | Technologies |
|---|---|
| **Frontend** | SvelteKit 2, Svelte 5 (Runes: `$state`, `$derived`, `$props`), Tailwind CSS 4, Iconoir SVG icons |
| **Backend API** | NestJS 11, TypeScript, TypeORM, Class-Validator, Node.js 22 |
| **Database & Cache** | Rumpty Cloud Serverless PostgreSQL 16 (Strict SSL CA), Rumpty Redis |
| **AI & LLM Services** | Groq Cloud (Llama 3.3 70B / DeepSeek), YarnGPT Voice AI, 9jaLingo TTS, Azure Speech |
| **External APIs** | FatSecret Platform API (OAuth 2.0), Open Food Facts REST API |
| **Notifications** | Web Push Protocol, VAPID Keys, Service Worker |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 22+ and npm
- PostgreSQL (or Rumpty Cloud connection string)

### 2. Installation & Run

```powershell
# Clone the repository
git clone https://github.com/Michvista/Sabi-DevCenter.git
cd Sabi-DevCenter

# Install workspace dependencies
npm install

# Start the NestJS API server (Port 8080)
npm run start:dev --workspace @sabi/api

# In a separate terminal, start the SvelteKit frontend (Port 5173)
npm run dev --workspace @sabi/web
```

### 👩‍⚕️ Judge Demo Accounts

Instant demo sign-in buttons are available directly on the login screens:

- **Pregnant Person**: `demo.pregnant@sabi.health` / `SabiDemo2026!`
- **Care Team Midwife**: `demo.midwife@sabi.health` / `SabiDemo2026!`
- **Demo Connection Code**: `SABICRE`

---

## 📜 Clinical Safety & Scope

*Sabi is an educational companion and continuity-of-care tool. It does not provide medical diagnosis, prescribe pharmaceutical treatment, or replace clinical antenatal attendance. Mothers experiencing severe danger signs (heavy vaginal bleeding, severe abdominal pain, persistent headaches with vision blur, or decreased fetal movement) are directed to seek emergency hospital care immediately or call 112.*
