import { Injectable } from "@nestjs/common";

export const urgentSymptoms = [
  "vaginal bleeding",
  "bleeding",
  "severe headache",
  "blurred vision",
  "high fever",
  "severe abdominal pain",
  "severe belly pain",
  "difficulty breathing",
  "seizure",
  "baby moving less",
  "reduced fetal movement",
  "water breaking",
  "fainting",
];

@Injectable()
export class SafetyService {
  assess(symptoms: string[]) {
    const normalized = symptoms
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const urgent = normalized.filter((symptom) =>
      urgentSymptoms.some((warning) => symptom.includes(warning)),
    );
    if (urgent.length) {
      return {
        level: "urgent" as const,
        title: "Please seek urgent medical care now",
        message:
          "These symptoms can need immediate assessment during pregnancy. Contact your midwife or go to the nearest health facility now. If you feel faint or very unwell, ask someone to help you get there.",
        matched: urgent,
      };
    }
    if (normalized.length) {
      return {
        level: "contact-care-team" as const,
        title: "Check in with your care team",
        message:
          "I can’t tell what is causing a symptom. Contact your midwife or health worker for advice, especially if it is new, worsening, or worrying you.",
        matched: normalized,
      };
    }
    return {
      level: "no-symptoms" as const,
      title: "No symptoms selected",
      message:
        "If you feel unwell or are worried, contact a qualified health worker.",
      matched: [],
    };
  }
}
