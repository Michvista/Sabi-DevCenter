# Sabi — Maternal Care Close to Home

> **"You Sabi"** — In Nigerian Pidgin, *Sabi* means **to know**, **to understand deeply**, and **to be wise**. 
> We named this companion **Sabi** because maternal health in Nigeria should never feel like navigating the dark. Every pregnant mother and family deserves to truly *sabi* what their body is experiencing, *sabi* what culturally familiar meals nourish their growing baby, and *sabi* exactly when a symptom needs urgent medical attention.

Sabi is a culturally rooted, evidence-guided maternal health companion designed for Nigerian families in the critical weeks between antenatal clinic appointments. It connects pregnant mothers directly with their local midwives and community healthcare workers through a consent-governed care team portal.

---

## 💡 Why the Name "Sabi"?

1. **Deep Cultural Resonance**: In Nigerian everyday lingua across all 36 states, *"I sabi"* represents confidence, clarity, and competence. Expecting mothers are often inundated with contradictory advice, unmeasured concoctions (*agbo*), and myths. Sabi empowers women with evidence-based knowledge in language and foods they recognize.
2. **Clinical Partnership**: Sabi bridges the patient-clinician gap. Between monthly or bi-weekly antenatal checkups, mothers log how they feel, track symptoms, and communicate directly with their connected nurse or midwife.
3. **Indigenous Nutritional Intelligence**: Rather than foreign food guides, Sabi focuses on local staples across all six geopolitical zones (Ugwu, Egusi, Tuwo, Miyan Kuka, Moi-Moi, Afang, Unripe Plantain) using reference measurements from the **FAO/INFOODS Western Africa Food Composition Table** and Nigerian nutritional research (Ayogu et al.).

---

## 🌟 Core Feature Suite

### 1. For Expectant Mothers (`/pregnant/dashboard`)
- **Interactive Week-by-Week Guide**: Baby size milestones, anatomical changes, warning signs, and specific questions to ask at the next clinic visit across all 42 weeks.
- **Dynamic Nigerian Meal Planner**: 7-day trimester-tailored meal combos (Breakfast, Lunch, Dinner) optimized for priority fetal nutrients (folate, calcium, iron, potassium).
- **Interactive Food Journal & Recipe Estimator**: Search traditional foods, calculate portion nutrients based on FAO/INFOODS composition data, and build custom recipe nutrient profiles.
- **Smart Market & Grocery List**: Automatically export ingredients from your 7-day meal plan into an interactive shopping checklist.
- **Medication Safety Directory**: 50+ common drugs, supplements, and indigenous preparations categorized into Safe, Caution, and Strictly Avoided (with clinical warnings on traditional unstandardized concoctions/agbo).
- **Pause & Notice Wellness Check-in**: Daily mood logging and quick symptom checks with immediate triage guidance and Nigerian emergency hotlines (112).
- **Two-Way Midwife Care Channel**: Once linked via midwife connection code, check-ins sync live to the midwife's dashboard and patients can exchange direct questions and clinical follow-up notes.
- **Multilingual Audio & Voice Accessibility**: Listen to weekly guides narrated in Nigerian English, Hausa, Igbo, Yorùbá, or Nigerian Pidgin.

### 2. For Nurses, Midwives & Clinics (`/midwife/dashboard`)
- **Segregated Clinical Suite**:
  - **Patient Overview**: Real-time roster of connected patients with estimated due dates, current gestational weeks, and latest check-in status.
  - **Priority Follow-Up Queue**: Filtered attention list for mothers reporting warning signs (severe abdominal pain, bleeding, reduced movement).
  - **Two-Way Patient Messages**: Dedicated conversation threads to answer patient questions, review symptom reports, and send reassurance notes between visits.
  - **Clinical Content Review Queue**: Audit trail for clinicians to review and leave revision notes on weekly educational excerpts.
- **Consent-Governed Linking**: Patients connect securely using their midwife's unique 6-character Sabi connection code (e.g. `SABICRE` for demo).

---

## 🛠 Tech Stack & Architecture

- **Frontend**: SvelteKit 2, Svelte 5 (Runes: `$state`, `$derived`, `$props`), Tailwind CSS 4, Iconoir icon suite.
- **Backend API**: NestJS, TypeORM, Class-Validator, JWT authentication with role-based access control (`PREGNANT_PERSON` and `MIDWIFE`).
- **Database & Storage**: Rumpty Cloud Managed PostgreSQL with SSL verification, Redis queue.
- **AI & Integrations**:
  - **Groq**: Fast inference engine for dynamic 7-day regional meal plan generation and translation.
  - **FatSecret Platform API**: OAuth 2.0 verified food & nutrition database integration.
  - **YarnGPT & 9jaLingo**: Multilingual speech synthesis supporting indigenous Nigerian languages.
  - **Azure Speech Services**: High-fidelity Nigerian English neural voice (`en-NG-EzinneNeural`).
  - **FAO/INFOODS WAFCT 2019**: Attributed West African reference micronutrient dataset.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 22.17+ and npm
- PostgreSQL database (or Rumpty Cloud instance)

### Installation

```powershell
# Clone the repository
git clone https://github.com/Michvista/Sabi-DevCenter.git
cd Sabi-DevCenter

# Install dependencies
npm install

# Copy environment variables
Copy-Item .env.example .env

# Run database migrations
npm --workspace @sabi/api run db:migrate

# Start development servers (API on 8080, Web on 5173)
npm run dev
```

### 👩‍⚕️ Judge Demo Credentials

One-click demo sign-ins are available on the login screens:

- **Pregnant Person**: `demo.pregnant@sabi.health` / `SabiDemo2026!`
- **Care Team Midwife**: `demo.midwife@sabi.health` / `SabiDemo2026!`
- **Demo Connection Code**: `SABICRE`

---

## 🧪 Verification & Testing

```powershell
# Run full unit and integration test suites
npm test

# Type and syntax check
npm run check

# Production build verification
npm run build
```

---

## 📜 Clinical Disclaimer

*Sabi is a maternal health educational companion and continuity-of-care tool. It does not provide medical diagnosis or replace personalized clinical antenatal appointments. Any severe warning signs during pregnancy require immediate attention at the nearest healthcare facility or dialing emergency services (112).*
