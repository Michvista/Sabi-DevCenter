import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { IsString, MaxLength } from "class-validator";
import type { PushSubscription } from "web-push";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { NotificationsService } from "./notifications.service";

class SubscribeDto {
  @IsString() @MaxLength(2048) endpoint!: string;
  @IsString() @MaxLength(512) p256dh!: string;
  @IsString() @MaxLength(512) auth!: string;
}
class UnsubscribeDto {
  @IsString() @MaxLength(2048) endpoint!: string;
}

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get("vapid-public-key") publicKey() {
    return { publicKey: this.notifications.vapidPublicKey };
  }

  @Post("subscribe")
  @UseGuards(AuthGuard)
  async subscribe(
    @Req() req: AuthenticatedRequest,
    @Body() body: SubscribeDto,
  ) {
    if (req.auth.role !== "PREGNANT_PERSON")
      throw new ServiceUnavailableException(
        "Browser reminders are only available in the pregnant-person portal.",
      );
    try {
      return await this.notifications.subscribe(req.auth.userId, {
        endpoint: body.endpoint,
        keys: { p256dh: body.p256dh, auth: body.auth },
      } as PushSubscription);
    } catch {
      throw new ServiceUnavailableException(
        "Reminders could not be saved. Check the database connection.",
      );
    }
  }

  @Delete("subscribe")
  @UseGuards(AuthGuard)
  async unsubscribe(
    @Req() req: AuthenticatedRequest,
    @Body() body: UnsubscribeDto,
  ) {
    try {
      return await this.notifications.unsubscribe(
        req.auth.userId,
        body.endpoint,
      );
    } catch {
      throw new ServiceUnavailableException(
        "Reminder settings could not be updated.",
      );
    }
  }

  @Post("test")
  @UseGuards(AuthGuard)
  async test(@Req() req: AuthenticatedRequest) {
    if (req.auth.role !== "PREGNANT_PERSON")
      throw new ServiceUnavailableException(
        "Browser reminders are only available in the pregnant-person portal.",
      );
    try {
      return await this.notifications.sendTestNotification(req.auth.userId);
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : "Test reminder failed.",
      );
    }
  }
}
