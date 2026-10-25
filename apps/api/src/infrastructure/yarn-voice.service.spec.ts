import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceUnavailableException } from "@nestjs/common";
import { YarnVoiceService } from "./yarn-voice.service";

describe("YarnVoiceService", () => {
  const service = new YarnVoiceService();
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.YARNGPT_API_KEY;
    delete process.env.YARNGPT_DEFAULT_VOICE;
  });

  it("requires a server-side YarnGPT key", async () => {
    await expect(
      service.synthesizeGuide("A weekly guide."),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("speaks localized text without asking YarnGPT to translate it again", async () => {
    process.env.YARNGPT_API_KEY = "test-secret";
    // YarnGPT voice IDs are case-sensitive; accept the account's display casing.
    process.env.YARNGPT_DEFAULT_VOICE = "Idera";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await service.synthesizeGuide("A weekly guide.");
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe("https://api.yarngpt.ai/api/v1/streaming/conversation");
    expect(options.headers.Authorization).toBe("Bearer test-secret");
    expect(JSON.parse(options.body)).toMatchObject({
      text: "A weekly guide.",
      voice: "idera",
      output_format: "mp3",
    });
    expect(JSON.parse(options.body)).not.toHaveProperty("target_language");
    expect(result.audio).toEqual(Buffer.from([1, 2, 3]));
    expect(result.contentType).toBe("audio/mpeg");
  });

  it("does not expose upstream provider errors", async () => {
    process.env.YARNGPT_API_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("provider details", { status: 429 })),
    );

    await expect(
      service.synthesizeGuide("A guide."),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("rejects non-audio provider responses without trying to stream them", async () => {
    process.env.YARNGPT_API_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response('{"error":"provider error"}', {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    await expect(service.synthesizeGuide("A guide.")).rejects.toThrow(
      "Voice playback returned an unsupported response.",
    );
  });

  it("hides network errors behind a safe service response", async () => {
    process.env.YARNGPT_API_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network details")),
    );

    await expect(service.synthesizeGuide("A guide.")).rejects.toThrow(
      "Voice playback is temporarily unavailable. Please try again later.",
    );
  });
});
