import { Injectable, Optional } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { Cron } from "@nestjs/schedule";
import { randomUUID } from "node:crypto";
import type { DataSource } from "typeorm";
import webpush from "web-push";
import { PushSubscriptionEntity } from "../database/entities/push-subscription.entity";
import { PregnancyEntity } from "../database/entities/pregnancy.entity";

export function lagosDateAfterDays(days: number, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  const current = new Date(
    Date.UTC(
      Number(part("year")),
      Number(part("month")) - 1,
      Number(part("day")),
    ),
  );
  current.setUTCDate(current.getUTCDate() + days);
  return current.toISOString().slice(0, 10);
}

@Injectable()
export class NotificationsService {
  private readonly publicKey = process.env.WEB_PUSH_PUBLIC_KEY ?? "";
  private readonly privateKey = process.env.WEB_PUSH_PRIVATE_KEY ?? "";
  constructor(
    @Optional() @InjectDataSource() private readonly db?: DataSource,
  ) {
    if (this.publicKey && this.privateKey && process.env.WEB_PUSH_SUBJECT) {
      webpush.setVapidDetails(
        process.env.WEB_PUSH_SUBJECT,
        this.publicKey,
        this.privateKey,
      );
    }
  }
  get configured() {
    return !!(
      this.publicKey &&
      this.privateKey &&
      process.env.WEB_PUSH_SUBJECT
    );
  }
  get vapidPublicKey() {
    return this.configured ? this.publicKey : null;
  }

  async subscribe(userId: string, subscription: webpush.PushSubscription) {
    if (!this.db?.isInitialized)
      throw new Error("Rumpty PostgreSQL is unavailable.");
    const repo = this.db.getRepository(PushSubscriptionEntity);
    const row = await repo.findOneBy({
      userId,
      endpoint: subscription.endpoint,
    });
    const entity =
      row ??
      repo.create({
        id: randomUUID(),
        userId,
        endpoint: subscription.endpoint,
      });
    entity.keys = JSON.stringify(subscription.keys);
    await repo.save(entity);
    return { subscribed: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    if (!this.db?.isInitialized)
      throw new Error("Rumpty PostgreSQL is unavailable.");
    await this.db
      .getRepository(PushSubscriptionEntity)
      .delete({ userId, endpoint });
    return { subscribed: false };
  }

  async sendTestNotification(userId: string) {
    if (!this.configured || !this.db?.isInitialized)
      throw new Error("Browser push is not configured on the server.");
    const rows = await this.db
      .getRepository(PushSubscriptionEntity)
      .findBy({ userId });
    if (!rows.length) throw new Error("Enable browser reminders first.");
    const outcomes = await Promise.all(
      rows.map(async (entry) => {
        try {
          await webpush.sendNotification(
            { endpoint: entry.endpoint, keys: JSON.parse(entry.keys) },
            JSON.stringify({
              title: "Sabi reminders are working",
              body: "You’ll receive your weekly check-in and saved antenatal visit reminders here.",
              url: "/pregnant/dashboard",
            }),
          );
          return true;
        } catch (error) {
          const status =
            typeof error === "object" && error && "statusCode" in error
              ? Number(error.statusCode)
              : 0;
          if (status === 404 || status === 410)
            await this.db!.getRepository(PushSubscriptionEntity).delete({
              id: entry.id,
            });
          return false;
        }
      }),
    );
    if (!outcomes.some(Boolean))
      throw new Error(
        "The browser push service rejected this subscription. Turn reminders off and enable them again.",
      );
    return { sent: true };
  }

  @Cron("0 9 * * 1", { timeZone: "Africa/Lagos" })
  async sendWeeklyReminders() {
    if (!this.configured || !this.db?.isInitialized) return;
    const repo = this.db.getRepository(PushSubscriptionEntity);
    const subscriptions = await repo.find();
    await Promise.all(
      subscriptions.map(async (entry) => {
        try {
          await webpush.sendNotification(
            { endpoint: entry.endpoint, keys: JSON.parse(entry.keys) },
            JSON.stringify({
              title: "A gentle Sabi check-in",
              body: "Pause for a moment, note how you are feeling, and keep your antenatal visit in view. For urgent concerns, contact your health worker.",
              url: "/pregnant/dashboard",
            }),
          );
        } catch (error) {
          const status =
            typeof error === "object" && error && "statusCode" in error
              ? Number(error.statusCode)
              : 0;
          if (status === 404 || status === 410)
            await repo.delete({ id: entry.id });
        }
      }),
    );
  }

  @Cron("0 9 * * *", { timeZone: "Africa/Lagos" })
  async sendAntenatalVisitReminders() {
    if (!this.configured || !this.db?.isInitialized) return;
    const visitDate = lagosDateAfterDays(1);
    const visits = await this.db
      .getRepository(PregnancyEntity)
      .findBy({ nextVisitDate: visitDate });
    const subscriptions = this.db.getRepository(PushSubscriptionEntity);
    await Promise.all(
      visits.map(async (visit) => {
        const patientSubscriptions = await subscriptions.findBy({
          userId: visit.userId,
        });
        await Promise.all(
          patientSubscriptions.map(async (entry) => {
            try {
              await webpush.sendNotification(
                { endpoint: entry.endpoint, keys: JSON.parse(entry.keys) },
                JSON.stringify({
                  title: "Antenatal visit reminder",
                  body: "You have a saved antenatal visit tomorrow. Contact your health facility if your plans change.",
                  url: "/pregnant/dashboard",
                }),
              );
            } catch (error) {
              const status =
                typeof error === "object" && error && "statusCode" in error
                  ? Number(error.statusCode)
                  : 0;
              if (status === 404 || status === 410) {
                await subscriptions.delete({ id: entry.id });
              }
            }
          }),
        );
      }),
    );
  }
}
