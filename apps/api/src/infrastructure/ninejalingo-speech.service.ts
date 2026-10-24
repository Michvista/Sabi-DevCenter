import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { fetchWithDnsRetry } from "./fetch-with-dns-retry";

@Injectable()
export class NineJalingoSpeechService {
  async synthesizeGuide(text: string, language: "pcm") {
    const apiKey = process.env.NINEJALINGO_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Pidgin audio is not configured yet.",
      );
    }
    const voice = process.env.NINEJALINGO_PIDGIN_VOICE || "ada_pcm";
    let response: Response;
    try {
      response = await fetchWithDnsRetry(
        "https://api.9jalingo.org/v1/audio/speech",
        {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.NINEJALINGO_MODEL || "9jalingo-tts-1",
            input: text.trim().slice(0, 4_900),
            voice,
            lang: language,
            response_format: "mp3",
          }),
          signal: AbortSignal.timeout(90_000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        "Pidgin audio is temporarily unavailable. Please try again later.",
      );
    }
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("audio")
    ) {
      throw new ServiceUnavailableException(
        "Pidgin audio is temporarily unavailable. Please try again later.",
      );
    }
    const audio = Buffer.from(await response.arrayBuffer());
    if (!audio.length) {
      throw new ServiceUnavailableException(
        "No audio was returned. Please try again later.",
      );
    }
    return {
      audio,
      contentType: response.headers.get("content-type") ?? "audio/mpeg",
    };
  }
}
