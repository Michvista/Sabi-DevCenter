import { describe, expect, it, vi } from "vitest";
import { ServiceUnavailableException } from "@nestjs/common";
import { VoiceController } from "./voice.controller";

describe("VoiceController language fallback", () => {
  it("does not replace a requested Nigerian language with English audio", async () => {
    const yarn = {
      synthesizeGuide: vi.fn().mockRejectedValue(new Error("offline")),
    };
    const azure = { synthesizeEnglishGuide: vi.fn() };
    const nineJalingo = { synthesizeGuide: vi.fn() };
    const controller = new VoiceController(
      yarn as never,
      azure as never,
      nineJalingo as never,
    );

    await expect(
      controller.guide(
        { text: "A general guide", targetLanguage: "ha" },
        { setHeader: vi.fn() },
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(azure.synthesizeEnglishGuide).not.toHaveBeenCalled();
  });

  it("uses the English fallback only for an English request", async () => {
    const audio = { audio: Buffer.from([1]), contentType: "audio/mpeg" };
    const yarn = {
      synthesizeGuide: vi.fn().mockRejectedValue(new Error("offline")),
    };
    const azure = { synthesizeEnglishGuide: vi.fn().mockResolvedValue(audio) };
    const nineJalingo = { synthesizeGuide: vi.fn() };
    const setHeader = vi.fn();
    const controller = new VoiceController(
      yarn as never,
      azure as never,
      nineJalingo as never,
    );

    const result = await controller.guide(
      { text: "A general guide", targetLanguage: "en" },
      { setHeader },
    );

    expect(azure.synthesizeEnglishGuide).toHaveBeenCalledWith(
      "A general guide",
    );
    expect(setHeader).toHaveBeenCalledWith(
      "X-Sabi-Audio-Fallback",
      "azure-original-english",
    );
    expect(result).toBeDefined();
  });

  it("uses the Pidgin voice service without routing Pidgin through YarnGPT", async () => {
    const audio = { audio: Buffer.from([1]), contentType: "audio/mpeg" };
    const yarn = { synthesizeGuide: vi.fn() };
    const azure = { synthesizeEnglishGuide: vi.fn() };
    const nineJalingo = { synthesizeGuide: vi.fn().mockResolvedValue(audio) };
    const controller = new VoiceController(
      yarn as never,
      azure as never,
      nineJalingo as never,
    );
    const setHeader = vi.fn();

    await controller.guide(
      { text: "A short translated guide", targetLanguage: "pcm" },
      { setHeader },
    );

    expect(nineJalingo.synthesizeGuide).toHaveBeenCalledWith(
      "A short translated guide",
      "pcm",
    );
    expect(yarn.synthesizeGuide).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith(
      "X-Sabi-Audio-Fallback",
      "9jalingo-pidgin",
    );
  });
});
