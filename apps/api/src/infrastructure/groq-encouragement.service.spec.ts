import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceUnavailableException } from "@nestjs/common";

const { createCompletion } = vi.hoisted(() => ({
  createCompletion: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = { completions: { create: createCompletion } };
    constructor(_options: unknown) {}
  },
}));

import { GroqEncouragementService } from "./groq-encouragement.service";

describe("GroqEncouragementService", () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
    createCompletion.mockReset();
  });
  afterEach(() => delete process.env.GROQ_API_KEY);

  it("sends only the week number to the non-clinical generation prompt", async () => {
    createCompletion.mockResolvedValue({
      choices: [
        { message: { content: "Take this journey one day at a time." } },
      ],
    });
    const service = new GroqEncouragementService();

    await expect(service.forWeek(21)).resolves.toEqual({
      message: "Take this journey one day at a time.",
    });
    expect(createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: "Pregnancy week: 21.",
          }),
        ]),
      }),
    );
  });

  it("does not return provider errors to the user", async () => {
    createCompletion.mockRejectedValue(new Error("upstream details"));
    const service = new GroqEncouragementService();
    await expect(service.forWeek(21)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
