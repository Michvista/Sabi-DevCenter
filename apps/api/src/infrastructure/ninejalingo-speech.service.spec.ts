import { afterEach, describe, expect, it, vi } from "vitest";
import { NineJalingoSpeechService } from "./ninejalingo-speech.service";

describe("NineJalingoSpeechService", () => {
  afterEach(() => {
    delete process.env.NINEJALINGO_API_KEY;
    delete process.env.NINEJALINGO_PIDGIN_VOICE;
    vi.unstubAllGlobals();
  });

  it("sends translated Pidgin to the configured 9jaLingo speaker", async () => {
    process.env.NINEJALINGO_API_KEY = "test-key";
    process.env.NINEJALINGO_PIDGIN_VOICE = "ada_pcm";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2]), {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new NineJalingoSpeechService().synthesizeGuide(
      "How you dey?",
      "pcm",
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.9jalingo.org/v1/audio/speech");
    expect(options.headers["x-api-key"]).toBe("test-key");
    expect(JSON.parse(options.body)).toMatchObject({
      input: "How you dey?",
      voice: "ada_pcm",
      lang: "pcm",
      response_format: "mp3",
    });
    expect(result.audio).toEqual(Buffer.from([1, 2]));
  });
});
