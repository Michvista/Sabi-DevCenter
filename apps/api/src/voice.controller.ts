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
  YarnVoiceService,
} from "./infrastructure/yarn-voice.service";
import { AzureSpeechService } from "./infrastructure/azure-speech.service";
import {
  NineJalingoSpeechService,
  type NineJalingoLanguage,
} from "./infrastructure/ninejalingo-speech.service";

const AUDIO_LANGUAGE_CODES = YARN_LANGUAGE_CODES;
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

    // The web client already translates non-English text before TTS. YarnGPT's
    // catalogue voices speak these languages directly; omitting target_language
    // prevents it from translating the already-localized guide a second time.
    try {
      result = await this.yarn.synthesizeGuide(body.text);
    } catch {
      if (
        body.targetLanguage === "ha" ||
        body.targetLanguage === "ig" ||
        body.targetLanguage === "yo" ||
        body.targetLanguage === "pcm"
      ) {
        try {
          result = await this.nineJalingo.synthesizeGuide(
            body.text,
            body.targetLanguage as NineJalingoLanguage,
          );
          if (!result?.audio) throw new Error("No 9jaLingo audio");
          fallback = `9jalingo-${body.targetLanguage}`;
        } catch {
          throw new ServiceUnavailableException(
            "Audio in this language is temporarily unavailable. Please try again later.",
          );
        }
      } else {
        // For English, use Azure Nigerian English voice
        result = await this.azure.synthesizeEnglishGuide(body.text);
        fallback = "azure-original-english";
      }
    }

    response.setHeader("X-Sabi-Audio-Fallback", fallback);
    return new StreamableFile(result.audio, {
      type: result.contentType,
      disposition: 'inline; filename="sabi-week-guide.mp3"',
    });
  }
}
