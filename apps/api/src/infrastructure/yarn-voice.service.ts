import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { fetchWithDnsRetry } from "./fetch-with-dns-retry";

export const YARN_LANGUAGE_CODES = ["en", "ha", "ig", "yo", "pcm"] as const;
export type YarnLanguageCode = (typeof YARN_LANGUAGE_CODES)[number];

@Injectable()
export class YarnVoiceService {
  async synthesizeGuide(text: string) {
    const apiKey = process.env.YARNGPT_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Voice playback is not configured yet.",
      );
    }

    const narration = text.trim().slice(0, 4_900);
    if (!narration) {
      throw new ServiceUnavailableException("There is no guide text to read.");
    }

    let response: Response;
    try {
      response = await fetchWithDnsRetry(
        "https://api.yarngpt.ai/api/v1/streaming/conversation",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            text: narration,
            ...(process.env.YARNGPT_DEFAULT_VOICE
              ? {
                  voice: process.env.YARNGPT_DEFAULT_VOICE.trim().toLowerCase(),
                }
              : {}),
            output_format: "mp3",
          }),
          signal: AbortSignal.timeout(90_000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        "Voice playback is temporarily unavailable. Please try again later.",
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        "Voice playback is temporarily unavailable. Please try again later.",
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("audio/")) {
      throw new ServiceUnavailableException(
        "Voice playback returned an unsupported response. Please try again.",
      );
    }

    let audio: Buffer;
    try {
      audio = Buffer.from(await response.arrayBuffer());
    } catch {
      throw new ServiceUnavailableException(
        "Voice playback was interrupted. Please try again.",
      );
    }
    if (audio.length === 0) {
      throw new ServiceUnavailableException(
        "No audio was returned. Please try again.",
      );
    }

    return {
      audio,
      contentType,
    };
  }
}
