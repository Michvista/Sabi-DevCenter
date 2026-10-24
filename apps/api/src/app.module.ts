import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PregnancyController } from "./pregnancy.controller";
import { SafetyService } from "./safety.service";
import { ObjectStorageService } from "./infrastructure/object-storage.service";
import { RedisQueueService } from "./infrastructure/redis-queue.service";
import { RumptyInferenceService } from "./infrastructure/rumpty-inference.service";
import { VoiceController } from "./voice.controller";
import { YarnVoiceService } from "./infrastructure/yarn-voice.service";
import { FoodSearchService } from "./infrastructure/food-search.service";
import { GroqEncouragementService } from "./infrastructure/groq-encouragement.service";
import { AzureSpeechService } from "./infrastructure/azure-speech.service";
import { DatabaseModule } from "./database/database.module";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { AuthGuard } from "./auth/auth.guard";
import { RecordsController } from "./records/records.controller";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationsController } from "./notifications/notifications.controller";
import { NotificationsService } from "./notifications/notifications.service";
import { TranslationController } from "./translation/translation.controller";
import { TranslationService } from "./translation/translation.service";
import { NineJalingoSpeechService } from "./infrastructure/ninejalingo-speech.service";
import { PregnancyBookIndexService } from "./infrastructure/pregnancy-book-index.service";

@Module({
  imports: [DatabaseModule.forRoot(), ScheduleModule.forRoot()],
  controllers: [
    HealthController,
    PregnancyController,
    VoiceController,
    AuthController,
    RecordsController,
    NotificationsController,
    TranslationController,
  ],
  providers: [
    SafetyService,
    AuthService,
    AuthGuard,
    NotificationsService,
    RedisQueueService,
    ObjectStorageService,
    RumptyInferenceService,
    YarnVoiceService,
    FoodSearchService,
    GroqEncouragementService,
    AzureSpeechService,
    NineJalingoSpeechService,
    TranslationService,
    PregnancyBookIndexService,
  ],
})
export class AppModule {}
