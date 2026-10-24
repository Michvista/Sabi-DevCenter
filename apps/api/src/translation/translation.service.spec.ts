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

import { TranslationService } from "./translation.service";

describe("TranslationService", () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
    createCompletion.mockReset();
  });
  afterEach(() => delete process.env.GROQ_API_KEY);

  it("translates only the supplied static guide and caches the result", async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: "Itumọ̀ ìtọ́sọ́nà." } }],
    });
    const service = new TranslationService();
    await expect(
      service.translateGuide("A short guide.", "yo"),
    ).resolves.toMatchObject({
      language: "yo",
      translation: "Itumọ̀ ìtọ́sọ́nà.",
      cached: false,
    });
    await expect(
      service.translateGuide("A short guide.", "yo"),
    ).resolves.toMatchObject({
      cached: true,
    });
    expect(createCompletion).toHaveBeenCalledTimes(1);
  });

  it("does not expose model errors or accept oversized source text", async () => {
    createCompletion.mockRejectedValue(new Error("provider details"));
    const service = new TranslationService();
    await expect(
      service.translateGuide("A guide.", "ha"),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(
      service.translateGuide("x".repeat(5001), "ha"),
    ).rejects.toThrow("This guide cannot be translated right now.");
  });
});
