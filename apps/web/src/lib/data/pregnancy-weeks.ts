import bookNotesData from "./pregnancy-week-book-notes.json";

export type WeekGuide = {
  week: number;
  title: string;
  focus: string;
  gentlePrompt: string;
  bookNote?: string;
  citationPages: number[];
  reviewStatus: "not-reviewed" | "clinician-review-required";
};

type CachedBookNote = {
  week: number;
  summary: string;
  citationPages: number[];
  reviewStatus: "clinician-review-required";
};

const bookNotes = new Map(
  (bookNotesData.notes as CachedBookNote[]).map((note) => [note.week, note]),
);

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

export const pregnancyWeeks: WeekGuide[] = themes.map(
  ([focus, gentlePrompt], index) => ({
    week: index + 1,
    title: `Week ${index + 1}: ${focus}`,
    focus,
    gentlePrompt,
    bookNote: bookNotes.get(index + 1)?.summary,
    citationPages: bookNotes.get(index + 1)?.citationPages ?? [],
    reviewStatus: bookNotes.has(index + 1)
      ? "clinician-review-required"
      : "not-reviewed",
  }),
);

export function getPregnancyWeek(week: number): WeekGuide {
  const safeWeek = Math.min(42, Math.max(1, Math.floor(week)));
  return pregnancyWeeks[safeWeek - 1];
}
