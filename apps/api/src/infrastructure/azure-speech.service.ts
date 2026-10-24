import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { fetchWithDnsRetry } from "./fetch-with-dns-retry";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

@Injectable()
export class AzureSpeechService {
  get configured() {
    return Boolean(
      process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION,
    );
  }

  async synthesizeEnglishGuide(text: string) {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) {
      throw new ServiceUnavailableException(
        "Azure Speech fallback is not configured.",
      );
    }

    try {
      const response = await fetchWithDnsRetry(
        `https://${encodeURIComponent(region)}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": key,
            "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
            "Content-Type": "application/ssml+xml",
            "User-Agent": "Sabi-Maternal-Companion",
          },
          body: `<speak version="1.0" xml:lang="en-NG"><voice name="en-NG-EzinneNeural">${escapeXml(text.trim().slice(0, 4_900))}</voice></speak>`,
          signal: AbortSignal.timeout(45_000),
        },
      );
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("audio/")
      ) {
        throw new Error("Azure Speech returned no audio");
      }
      const audio = Buffer.from(await response.arrayBuffer());
      if (!audio.length)
        throw new Error("Azure Speech returned an empty response");
      return {
        audio,
        contentType: response.headers.get("content-type") ?? "audio/mpeg",
      };
    } catch {
      throw new ServiceUnavailableException(
        "Both voice services are temporarily unavailable. Please try again later.",
      );
    }
  }
}
