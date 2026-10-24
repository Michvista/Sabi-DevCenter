import bookNotesData from "./pregnancy-week-book-notes.json";

export type WeekGuide = {
  week: number;
  title: string;
  focus: string;
  gentlePrompt: string;
  bookNote?: string;
  bookSections: BookGuideSection[];
  citationPages: number[];
  antenatalFocus: string;
  nutritionFocus: string;
  reviewStatus: "not-reviewed" | "clinician-review-required";
  trimester: 1 | 2 | 3;
  babyFruit: string;
  babyLength: string;
  babyWeight: string;
  nigerianFoodTip: string;
  keyNutrients: string[];
  recommendedFoods: string[];
  foodsToAvoid: string[];
  dangerSigns: string[];
  clinicQuestions: string[];
};

export type BookGuideSection = {
  title: string;
  summary: string;
  citationPages: number[];
};

type CachedBookNote = {
  week: number;
  summary: string;
  sections: BookGuideSection[];
  citationPages: number[];
  reviewStatus: "clinician-review-required";
};

const bookNotes = new Map(
  (bookNotesData.notes as CachedBookNote[]).map((note) => [note.week, note]),
);

const babySizeTable = [
  { fruit: "Poppy seed", length: "< 0.1 cm", weight: "< 0.01 g" },
  { fruit: "Mustard seed", length: "< 0.1 cm", weight: "< 0.01 g" },
  { fruit: "Chia seed", length: "0.1 cm", weight: "< 0.01 g" },
  { fruit: "Poppy seed", length: "0.2 cm", weight: "< 0.1 g" },
  { fruit: "Sesame seed", length: "0.3 cm", weight: "< 0.2 g" },
  { fruit: "Aganyin bean", length: "0.6 cm", weight: "< 0.5 g" },
  { fruit: "Agbalumo seed", length: "1.3 cm", weight: "0.8 g" },
  { fruit: "Kidney bean", length: "1.6 cm", weight: "1 g" },
  { fruit: "Grape", length: "2.3 cm", weight: "2 g" },
  { fruit: "Lime berry", length: "3.1 cm", weight: "4 g" },
  { fruit: "Small plum", length: "4.1 cm", weight: "7 g" },
  { fruit: "Lime", length: "5.4 cm", weight: "14 g" },
  { fruit: "Lemon", length: "7.4 cm", weight: "23 g" },
  { fruit: "Sweet Orange", length: "8.7 cm", weight: "43 g" },
  { fruit: "Garden Egg", length: "10.1 cm", weight: "70 g" },
  { fruit: "Avocado (Ube)", length: "11.6 cm", weight: "100 g" },
  { fruit: "Guava", length: "13.0 cm", weight: "140 g" },
  { fruit: "Bell pepper (Tatase)", length: "14.2 cm", weight: "190 g" },
  { fruit: "Ripe Mango", length: "15.3 cm", weight: "240 g" },
  { fruit: "Banana (Ogede)", length: "25.6 cm", weight: "300 g" },
  { fruit: "Fresh Carrot", length: "26.7 cm", weight: "360 g" },
  { fruit: "Grapefruit", length: "27.8 cm", weight: "430 g" },
  { fruit: "Sweet Potato", length: "28.9 cm", weight: "500 g" },
  { fruit: "Maize cob", length: "30.0 cm", weight: "600 g" },
  { fruit: "Acorn squash", length: "34.6 cm", weight: "660 g" },
  { fruit: "Garden Cucumber", length: "35.6 cm", weight: "760 g" },
  { fruit: "Cabbage head", length: "36.6 cm", weight: "875 g" },
  { fruit: "Large Eggplant", length: "37.6 cm", weight: "1.0 kg" },
  { fruit: "Butternut squash", length: "38.6 cm", weight: "1.2 kg" },
  { fruit: "Round Cabbage", length: "39.9 cm", weight: "1.3 kg" },
  { fruit: "Coconut", length: "41.1 cm", weight: "1.5 kg" },
  { fruit: "Small Yam tuber", length: "42.4 cm", weight: "1.7 kg" },
  { fruit: "Ripe Pineapple", length: "43.7 cm", weight: "1.9 kg" },
  { fruit: "Papaya (Pawpaw)", length: "45.0 cm", weight: "2.1 kg" },
  { fruit: "Honeydew melon", length: "46.2 cm", weight: "2.4 kg" },
  { fruit: "Large Pawpaw", length: "47.4 cm", weight: "2.6 kg" },
  { fruit: "Winter melon", length: "48.6 cm", weight: "2.9 kg" },
  { fruit: "Golden Pumpkin", length: "49.8 cm", weight: "3.1 kg" },
  { fruit: "Watermelon", length: "50.7 cm", weight: "3.3 kg" },
  { fruit: "Full-term baby", length: "51.2 cm", weight: "3.4 kg" },
  { fruit: "Full-term newborn", length: "51.5 cm", weight: "3.5 kg" },
  { fruit: "Full-term newborn", length: "52.0 cm", weight: "3.6 kg" },
];

function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 12) return 1;
  if (week <= 27) return 2;
  return 3;
}

function getWeekNutrition(week: number) {
  if (week <= 12) {
    return {
      tip: "Prioritize Folate and Vitamin B6 to support early neural tube closure and ease mild nausea. Eat small, frequent meals.",
      nutrients: ["Folate (B9)", "Vitamin B6", "Iron", "Fluids"],
      recommended: ["Cooked brown beans (Ewa)", "Boiled sweet potato", "Sweet oranges", "Oats with warm milk", "Boiled eggs"],
      avoid: ["Uncooked or undercooked meat/fish", "Unstandardized herbal mixtures (Agbo)", "Unpasteurized milk", "Excess caffeine"],
    };
  }
  if (week <= 27) {
    return {
      tip: "Your blood volume expands rapidly now. Boost dietary Iron paired with Vitamin C, plus Calcium for baby's bone mineral density.",
      nutrients: ["Iron", "Vitamin C", "Calcium", "Omega-3", "Fibre"],
      recommended: ["Fresh Ugwu (pumpkin leaves) soup with fish", "Moi moi with boiled egg", "Boiled plantain with fish sauce", "Groundnuts & cashew nuts", "Fortified cereals"],
      avoid: ["Raw eggs or uncooked batter", "High-mercury predatory fish", "Excess table salt", "Non-prescribed painkillers (NSAIDs)"],
    };
  }
  return {
    tip: "Baby is laying down glycogen, fat and bone calcium rapidly. Eat nutrient-dense protein foods and potassium-rich fruits.",
    nutrients: ["Protein", "Calcium", "Potassium", "Vitamin K", "Healthy Fats"],
    recommended: ["Egusi soup with fish or lean meat", "Tuwo with Miyan Kuka", "Ripe bananas", "Beans porridge with fish", "Fresh yoghurt or milk"],
    avoid: ["Heavy, greasy late-night meals (triggers heartburn)", "Unpasteurized soft cheese", "Street foods with unknown water safety"],
  };
}

function getDangerSigns(week: number): string[] {
  if (week <= 12) {
    return [
      "Vaginal bleeding or spotting",
      "Severe one-sided lower belly or pelvic pain",
      "High fever (above 38°C) or constant chills",
      "Severe vomiting with inability to keep any fluids down for 24 hours",
    ];
  }
  if (week <= 27) {
    return [
      "Sudden swelling in your face, hands or ankles",
      "Persistent severe headache that does not respond to rest",
      "Changes in vision (blurriness, spots, or flashing lights)",
      "Noticeable fluid leaking or vaginal bleeding",
      "Pain or burning when urinating (possible UTI)",
    ];
  }
  return [
    "Noticeable reduction or sudden stop in baby's regular kick count",
    "Gush or steady trickle of clear fluid from the vagina",
    "Bright red vaginal bleeding",
    "Severe headache, visual disturbances or upper stomach pain",
    "Regular, painful uterine contractions before 37 weeks",
  ];
}

function getClinicQuestions(week: number): string[] {
  if (week <= 12) {
    return [
      "Which routine blood tests (PCV/haemoglobin, genotype, blood group) should I complete?",
      "Is my daily folic acid and iron supplement dosage appropriate for my health history?",
      "What safe remedy do you advise if nausea or fatigue makes eating difficult?",
    ];
  }
  if (week <= 27) {
    return [
      "Are my blood pressure readings within a healthy range?",
      "When will you schedule my gestational diabetes check and tetanus toxoid vaccination?",
      "What daily pattern of fetal movements should I expect around this week?",
    ];
  }
  return [
    "Is my baby in a head-down (cephalic) position yet?",
    "What are the specific signs that mean I should head directly to the hospital or clinic?",
    "Who on the maternity team can I contact at night if my water breaks or contractions begin?",
  ];
}

// Original, plain-language prompts for the prototype. Clinical review is required before launch.
const themes = [
  [
    "A beginning to learn about",
    "Make room for questions and arrange antenatal care when pregnancy is confirmed.",
  ],
  [
    "A beginning to learn about",
    "Write down the date of your last period if you know it; your clinician can help estimate dates.",
  ],
  [
    "Early changes are underway",
    "Ask your health worker which routine visits and tests are recommended for you.",
  ],
  [
    "Small steps, steady care",
    "Keep water nearby and choose foods that feel manageable if nausea is affecting meals.",
  ],
  [
    "A season of early growth",
    "Bring questions about symptoms and medicines to a qualified health worker or pharmacist.",
  ],
  [
    "Building your care routine",
    "If you have not already, plan an antenatal visit and discuss your health history.",
  ],
  [
    "Your questions belong here",
    "Note any new concerns so you can discuss them at your next appointment.",
  ],
  [
    "One week at a time",
    "Gentle routines, rest and support from people you trust can help you feel cared for.",
  ],
  [
    "A changing season",
    "Ask your health worker what screenings or supplements are appropriate for your situation.",
  ],
  [
    "Finding your rhythm",
    "Keep taking only medicines agreed with your clinician; check before starting anything new.",
  ],
  [
    "Growing into a routine",
    "If food smells or nausea are difficult, discuss practical options with your care team.",
  ],
  [
    "A new chapter",
    "Prepare questions about your next antenatal visit, nutrition and any symptoms you have noticed.",
  ],
  [
    "The second trimester begins",
    "Your care team can explain what changes are common and what deserves a call.",
  ],
  [
    "A little more settled",
    "Keep appointments and ask how to contact your clinic if you need advice between visits.",
  ],
  [
    "Noticing change",
    "People experience pregnancy differently; share changes that worry you with your health worker.",
  ],
  [
    "Getting to know your body",
    "Ask your clinician when you may start to notice movement and what to do if concerned.",
  ],
  [
    "Questions about movement",
    "There is no single experience for everyone; ask your care team about movement guidance.",
  ],
  [
    "Care that fits you",
    "Discuss any ongoing pain, fever, bleeding or other worrying changes promptly.",
  ],
  [
    "A midpoint is near",
    "Consider who you would contact and how you would get to care if an urgent concern arose.",
  ],
  [
    "Around the middle",
    "Use your antenatal visit to ask about your health, the baby's growth and birth preparation.",
  ],
  [
    "A steady check-in",
    "Keep a simple list of questions and bring it to your next visit.",
  ],
  [
    "Making space for rest",
    "Ask for help with daily tasks if you need it, and mention sleep or mood concerns to your care team.",
  ],
  [
    "Looking ahead",
    "Discuss any travel, work or activity questions with a health worker who knows your pregnancy.",
  ],
  [
    "The final trimester begins",
    "Start talking with your care team about birth planning and where to seek urgent care.",
  ],
  [
    "Preparing with support",
    "Talk through your birth companion, transport plan and clinic contact with someone you trust.",
  ],
  [
    "Learning your baby's pattern",
    "Ask a clinician how to respond if you notice a concerning change in your baby's movements.",
  ],
  [
    "A plan you can reach",
    "Keep important clinic numbers and your transport plan somewhere easy to find.",
  ],
  [
    "Preparing for the weeks ahead",
    "Use antenatal care to ask about warning signs, birth plans and where to go for urgent help.",
  ],
  [
    "A little more preparation",
    "Check that you know where to seek care at any hour if a warning sign appears.",
  ],
  [
    "Close to the final stretch",
    "Discuss medicines, discomfort or questions with your clinician rather than self-treating.",
  ],
  [
    "Keep your care team close",
    "Share changes in how you feel and continue attending recommended visits.",
  ],
  [
    "Preparing for birth",
    "Review transport, support people and your chosen place of care with your health worker.",
  ],
  [
    "Your plan, your support",
    "Ask your care team what to expect and whom to contact as birth gets closer.",
  ],
  [
    "The final weeks",
    "Keep your clinic's contact details close and seek care promptly for any worrying change.",
  ],
  [
    "One day at a time",
    "Use your antenatal visit to review your birth and emergency plans.",
  ],
  [
    "Ready for the next step",
    "Stay in touch with your care team and follow their advice about when to come in.",
  ],
  [
    "Your care plan matters",
    "Call your clinic if you are uncertain about a symptom or the timing of your next visit.",
  ],
  [
    "Getting close",
    "Keep your support person and transport plan informed as your due date approaches.",
  ],
  [
    "Birth may be near",
    "Ask your health worker what signs mean it is time to contact or travel to your care facility.",
  ],
  [
    "Your care continues",
    "If your due date passes, follow your clinician's plan for check-ins and next steps.",
  ],
  [
    "Your care team guides what comes next",
    "If you are past your estimated due date, keep in contact with your maternity team and follow the plan they gave you.",
  ],
  [
    "Support for the next step",
    "Your clinician can explain your options and arrange the next check-in when your pregnancy continues beyond the estimated due date.",
  ],
] as const;

function antenatalFocus(week: number) {
  if (week <= 12)
    return "At an early antenatal contact, ask about your routine checks, nutrition, supplements and any medicines. WHO recommends starting antenatal care in the first trimester; your clinic will tailor the schedule to you.";
  if (week <= 19)
    return "Keep your antenatal visits and ask your care team which checks and locally recommended malaria prevention apply to you. WHO recommends blood-pressure checks at every contact.";
  if (week <= 23)
    return "From around 20 weeks, ask how your clinic checks blood pressure and screens for pre-eclampsia. Share new symptoms with a health worker promptly.";
  if (week <= 27)
    return "After 24 weeks, antenatal care includes monitoring the baby's growth. Ask whether glucose screening is planned around weeks 24–28 and when your next visit should be.";
  if (week <= 40)
    return "Use antenatal visits to discuss the baby's movements, birth and emergency plans, and where to seek urgent care. Your clinician can tell you what movement changes need immediate assessment.";
  return "If your pregnancy continues beyond the estimated due date, contact your maternity team and follow their plan for check-ins and next steps.";
}

const nutritionFocus =
  "WHO encourages a varied diet with vegetables, fruit, beans, nuts, whole grains, fish or other protein foods, and pasteurized dairy where available. Nigerian examples in Sabi’s catalogue include beans, ugwu, egusi, oats and millet. Food-composition values describe foods; they are not a personal pregnancy diet plan. Ask your health worker about supplements and food-safety needs for you.";

export const pregnancyWeeks: WeekGuide[] = themes.map(
  ([focus, gentlePrompt], index) => {
    const weekNumber = index + 1;
    const sizeInfo = babySizeTable[index] ?? { fruit: "Baby", length: "--", weight: "--" };
    const nutritionInfo = getWeekNutrition(weekNumber);
    return {
      week: weekNumber,
      title: `Week ${weekNumber}: ${focus}`,
      focus,
      gentlePrompt,
      bookNote: bookNotes.get(weekNumber)?.summary,
      bookSections: bookNotes.get(weekNumber)?.sections ?? [],
      citationPages: bookNotes.get(weekNumber)?.citationPages ?? [],
      antenatalFocus: antenatalFocus(weekNumber),
      nutritionFocus,
      reviewStatus: bookNotes.has(weekNumber)
        ? "clinician-review-required"
        : "not-reviewed",
      trimester: getTrimester(weekNumber),
      babyFruit: sizeInfo.fruit,
      babyLength: sizeInfo.length,
      babyWeight: sizeInfo.weight,
      nigerianFoodTip: nutritionInfo.tip,
      keyNutrients: nutritionInfo.nutrients,
      recommendedFoods: nutritionInfo.recommended,
      foodsToAvoid: nutritionInfo.avoid,
      dangerSigns: getDangerSigns(weekNumber),
      clinicQuestions: getClinicQuestions(weekNumber),
    };
  },
);

export function getPregnancyWeek(week: number): WeekGuide {
  const safeWeek = Math.min(42, Math.max(1, Math.floor(week)));
  return pregnancyWeeks[safeWeek - 1];
}

