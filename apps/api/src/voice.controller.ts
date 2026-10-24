import {
  Body,
  Controller,
  Header,
  Post,
  Res,
  StreamableFile,
  ServiceUnavailableException,
} from "@nestjs/common";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import {
  YARN_LANGUAGE_CODES,
  type YarnLanguageCode,
  YarnVoiceService,
} from "./infrastructure/yarn-voice.service";
import { AzureSpeechService } from "./infrastructure/azure-speech.service";
import { NineJalingoSpeechService } from "./infrastructure/ninejalingo-speech.service";

const AUDIO_LANGUAGE_CODES = [...YARN_LANGUAGE_CODES, "pcm"] as const;
type AudioLanguageCode = (typeof AUDIO_LANGUAGE_CODES)[number];

class GuideAudioDto {
  @IsString() @MinLength(1) @MaxLength(5000) text!: string;
  @IsIn(AUDIO_LANGUAGE_CODES) targetLanguage!: AudioLanguageCode;
}

@Controller("voice")
export class VoiceController {
  constructor(
    private readonly yarn: YarnVoiceService,
    private readonly azure: AzureSpeechService,
    private readonly nineJalingo: NineJalingoSpeechService,
  ) {}

  @Post("guide")
  @Header("Cache-Control", "no-store")
  async guide(
    @Body() body: GuideAudioDto,
    @Res({ passthrough: true })
    response: {
      setHeader(name: string, value: string): void;
    },
  ) {
    let result: { audio: Buffer; contentType: string };
    let fallback = "none";
    if (body.targetLanguage === "pcm") {
      result = await this.nineJalingo.synthesizeGuide(body.text, "pcm");
      response.setHeader("X-Sabi-Audio-Fallback", "9jalingo-pidgin");
      return new StreamableFile(result.audio, {
        type: result.contentType,
        disposition: 'inline; filename="sabi-week-guide.mp3"',
      });
    }
    try {
      result = await this.yarn.synthesizeGuide(
        body.text,
        body.targetLanguage as YarnLanguageCode,
      );
    } catch {
      if (body.targetLanguage !== "en") {
        throw new ServiceUnavailableException(
          "Audio in this language is temporarily unavailable. Please try again later.",
        );
      }
      result = await this.azure.synthesizeEnglishGuide(body.text);
      fallback = "azure-original-english";
    }
    response.setHeader("X-Sabi-Audio-Fallback", fallback);
    return new StreamableFile(result.audio, {
      type: result.contentType,
      disposition: 'inline; filename="sabi-week-guide.mp3"',
    });
  }
}
