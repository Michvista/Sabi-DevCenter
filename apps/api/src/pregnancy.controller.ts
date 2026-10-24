import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Optional,
} from "@nestjs/common";
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  Max,
  Min,
} from "class-validator";
import { SafetyService } from "./safety.service";
import { FoodSearchService } from "./infrastructure/food-search.service";
import { GroqEncouragementService } from "./infrastructure/groq-encouragement.service";
import { calculatePortion } from "./infrastructure/food-search.service";
import { InjectDataSource } from "@nestjs/typeorm";
import { PregnancyBookChunkEntity } from "./database/entities/pregnancy-book-chunk.entity";
import { ClinicalContentReviewEntity } from "./database/entities/clinical-content-review.entity";

class AssessDto {
  @IsArray()
  @IsIn(
    [
      "vaginal bleeding",
      "severe headache",
      "blurred vision",
      "high fever",
      "severe abdominal pain",
      "difficulty breathing",
      "seizure",
      "baby moving less",
      "water breaking",
      "fainting",
      "mild nausea",
      "back ache",
    ],
    { each: true },
  )
  symptoms!: string[];
}

class WeekDto {
  @IsInt() @Min(1) @Max(42) week!: number;
}

class PortionDto {
  @IsString() foodCode!: string;
  @IsNumber() servingGrams!: number;
}
class MealIdeasDto {
  @IsInt() @Min(1) @Max(42) week!: number;
  @IsOptional() @IsString() @MaxLength(40) region?: string;
  @IsOptional() @IsString() @MaxLength(20) budget?: string;
  @IsOptional() @IsBoolean() vegetarian?: boolean;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avoidIngredients?: string[];
}

@Controller("pregnancy")
export class PregnancyController {
  constructor(
    private readonly safety: SafetyService,
    private readonly food: FoodSearchService,
    private readonly encouragement: GroqEncouragementService,
    @Optional() @InjectDataSource() private readonly db?: DataSource,
  ) {}

  @Post("assess") assess(@Body() body: AssessDto) {
    return this.safety.assess(body.symptoms);
  }

  @Post("week") async week(@Body() body: WeekDto) {
    const bookChunk = this.db?.isInitialized
      ? await this.db
          .getRepository(PregnancyBookChunkEntity)
          .findOneBy({ week: body.week })
      : null;
    let bookSections: Array<{
      title: string;
      summary: string;
      citationPages: number[];
    }> = [];
    if (bookChunk) {
      try {
        const decoded = JSON.parse(bookChunk.content) as {
          sections?: typeof bookSections;
        };
        if (Array.isArray(decoded.sections)) bookSections = decoded.sections;
      } catch {
        // Continue to serve older one-paragraph rows until the bundled index refreshes them.
      }
      if (!bookSections.length) {
        bookSections = [
          {
            title: "From the book",
            summary: bookChunk.content.replace(/^Pregnancy week \d+\.\s*/, ""),
            citationPages: [bookChunk.page],
          },
        ];
      }
    }
    const review = this.db?.isInitialized
      ? await this.db
          .getRepository(ClinicalContentReviewEntity)
          .findOne({ where: { week: body.week }, order: { createdAt: "DESC" } })
      : null;

    return {
      week: body.week,
      trimester:
        body.week < 14
          ? "First trimester"
          : body.week < 28
            ? "Second trimester"
            : "Third trimester",
      title:
        body.week < 14
          ? "Small steps, steady care"
          : body.week < 28
            ? "A season of change"
            : "Getting ready, one day at a time",
      guidance:
        "Keep attending antenatal care and ask your health worker about questions that matter to you. Seek urgent care for warning signs.",
      clinicalReview: review
        ? {
            status: review.status,
            notes: review.notes,
            reviewedAt: review.createdAt,
          }
        : null,
      ...(bookChunk && bookSections.length
        ? {
            bookNote: bookSections.map((section) => section.summary).join(" "),
            bookSections,
            citationPages: [
              ...new Set(bookSections.flatMap((section) => section.citationPages)),
            ].sort((a, b) => a - b),
            source: "Your Pregnancy Week by Week — Curtis & Schuler",
          }
        : {}),
      disclaimer:
        "General education only. Your clinician can give advice for your individual pregnancy.",
    };
  }

  @Post("encouragement") encouragementForWeek(@Body() body: WeekDto) {
    return this.encouragement.forWeek(body.week);
  }

  @Get("foods") foods(@Query("q") query?: string) {
    if (query === undefined) {
      return {
        foods: [
          "beans",
          "ugwu (fluted pumpkin leaves)",
          "egusi seeds",
          "oats",
          "crayfish",
          "plantain",
          "millet",
          "groundnuts",
        ],
        message:
          "Search an ingredient or dish to view available nutrition data.",
      };
    }
    const cleaned = query.trim();
    if (cleaned.length < 2 || cleaned.length > 100) {
      throw new BadRequestException(
        "Search must be between 2 and 100 characters.",
      );
    }
    return this.food.search(cleaned);
  }

  @Get("foods/barcode/:code") barcode(@Param("code") code: string) {
    return this.food.lookupBarcode(code);
  }

  @Post("foods/portion") portion(@Body() body: PortionDto) {
    return this.food.portion(body.foodCode, body.servingGrams);
  }

  @Post("meal-plan/ideas") mealPlanIdeas(@Body() body: MealIdeasDto) {
    return this.food.suggestMealIdeas(body);
  }
}
