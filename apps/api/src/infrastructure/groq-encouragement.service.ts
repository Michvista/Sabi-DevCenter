import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class GroqEncouragementService {
  private readonly client = process.env.GROQ_API_KEY
    ? new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        // Provider responses can take longer than 12 seconds under load.
        timeout: 30_000,
        maxRetries: 1,
      })
    : null;

  async forWeek(week: number) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        "Encouragement is not configured yet.",
      );
    }

    try {
      const result = await this.client.chat.completions.create({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "Write one warm, culturally respectful, non-clinical encouragement for someone at this pregnancy week. Use at most 35 words. Do not give health, nutrition, medication, diagnosis, treatment, or emergency advice. Do not imply an outcome is guaranteed.",
          },
          { role: "user", content: `Pregnancy week: ${week}.` },
        ],
        temperature: 0.7,
        max_completion_tokens: 70,
      });
      const message = result.choices[0]?.message.content?.trim();
      if (!message) throw new Error("Empty Groq response");
      return { message };
    } catch {
      throw new ServiceUnavailableException(
        "Encouragement is temporarily unavailable. Please try again.",
      );
    }
  }
}
