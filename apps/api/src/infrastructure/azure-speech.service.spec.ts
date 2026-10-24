import { afterEach, describe, expect, it, vi } from "vitest";
import { AzureSpeechService } from "./azure-speech.service";

describe("AzureSpeechService", () => {
  const service = new AzureSpeechService();
  afterEach(() => {
    delete process.env.AZURE_SPEECH_KEY;
    delete process.env.AZURE_SPEECH_REGION;
    vi.unstubAllGlobals();
  });

  it("synthesizes an escaped original-English guide with the Nigeria voice", async () => {
    process.env.AZURE_SPEECH_KEY = "test-key";
    process.env.AZURE_SPEECH_REGION = "nigeria-region";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2]), {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await service.synthesizeEnglishGuide("Use egusi & beans.");
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toContain("nigeria-region.tts.speech.microsoft.com");
    expect(request.headers["Ocp-Apim-Subscription-Key"]).toBe("test-key");
    expect(request.body).toContain("en-NG-EzinneNeural");
    expect(request.body).toContain("egusi &amp; beans");
    expect(result.audio).toEqual(Buffer.from([1, 2]));
  });
});
