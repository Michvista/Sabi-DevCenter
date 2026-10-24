import { Body, Controller, Post } from "@nestjs/common";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import { GUIDE_LANGUAGES, TranslationService } from "./translation.service";

class TranslateGuideDto {
  @IsString() @MinLength(1) @MaxLength(5000) text!: string;
  @IsIn(Object.keys(GUIDE_LANGUAGES)) language!: keyof typeof GUIDE_LANGUAGES;
}

@Controller("translation")
export class TranslationController {
  constructor(private readonly translation: TranslationService) {}

  @Post("guide") translateGuide(@Body() body: TranslateGuideDto) {
    return this.translation.translateGuide(body.text, body.language);
  }
}
