import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createHash } from "node:crypto";
import OpenAI from "openai";

export const GUIDE_LANGUAGES = {
  ha: "Hausa",
  ig: "Igbo",
  yo: "Yoruba",
  pcm: "Nigerian Pidgin",
} as const;
export type GuideLanguage = keyof typeof GUIDE_LANGUAGES;

@Injectable()
export class TranslationService {
  private readonly client = process.env.GROQ_API_KEY
    ? new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        timeout: 30_000,
        maxRetries: 1,
      })
    : null;
  private readonly cache = new Map<
    string,
    { value: string; expires: number }
  >();

  async translateGuide(text: string, language: GuideLanguage) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        "Text translation is temporarily unavailable.",
      );
    }
    const source = text.trim();
    if (!source || source.length > 5_000) {
      throw new ServiceUnavailableException(
        "This guide cannot be translated right now.",
      );
    }
    const key = createHash("sha256")
      .update(`${language}\n${source}`)
      .digest("hex");
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return { language, translation: cached.value, cached: true };
    }

    try {
      const result = await this.client.chat.completions.create({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        temperature: 0.1,
        max_completion_tokens: 1_200,
        messages: [
          {
            role: "system",
            content: [
              `Translate the supplied English pregnancy education text into ${GUIDE_LANGUAGES[language]}.`,
              "Translate faithfully; do not summarize, add facts, or give advice.",
              "Preserve uncertainty, measurements, medicine names, and emergency wording exactly in meaning.",
              "If a phrase has no reliable translation, retain it in English and mark it with [check translation].",
              "Return only the translation.",
            ].join(" "),
          },
          { role: "user", content: source },
        ],
      });
      const translation = result.choices[0]?.message.content?.trim();
      if (!translation) throw new Error("Empty translation");
      if (this.cache.size >= 500) this.cache.clear();
      this.cache.set(key, {
        value: translation,
        expires: Date.now() + 86400000,
      });
      return { language, translation, cached: false };
    } catch {
      throw new ServiceUnavailableException(
        "Text translation is temporarily unavailable. Please try again later.",
      );
    }
  }
}
