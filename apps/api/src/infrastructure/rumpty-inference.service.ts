import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class RumptyInferenceService {
  private readonly client =
    process.env.RUMPTY_INFERENCE_API_KEY &&
    process.env.RUMPTY_INFERENCE_BASE_URL
      ? new OpenAI({
          apiKey: process.env.RUMPTY_INFERENCE_API_KEY,
          baseURL: process.env.RUMPTY_INFERENCE_BASE_URL,
        })
      : null;

  get configured() {
    return this.client !== null;
  }

  async summarizeNonClinical(text: string) {
    if (!this.client) throw new Error("Rumpty inference is not configured");
    if (text.length > 4000)
      throw new Error("Summary input exceeds 4000 characters");

    const result = await this.client.chat.completions.create({
      model: process.env.RUMPTY_INFERENCE_MODEL || "llama3.2:3b",
      messages: [
        {
          role: "system",
          content:
            "Summarize only non-clinical program or educational material. Do not create diagnosis, treatment, medication, nutrition prescriptions, or emergency triage advice.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    });

    return result.choices[0]?.message.content ?? "";
  }
}
