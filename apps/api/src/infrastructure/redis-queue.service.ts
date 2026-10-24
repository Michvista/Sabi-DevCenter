import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { redisTlsOptionsFromConfig } from "./redis-tls";

@Injectable()
export class RedisQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisQueueService.name);
  private readonly connection = process.env.RUMPTY_REDIS_URL
    ? new Redis(process.env.RUMPTY_REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        tls: redisTlsOptionsFromConfig(
          process.env.RUMPTY_REDIS_CA_CERT,
          process.env.RUMPTY_REDIS_CA_BASE64,
        ),
      })
    : null;

  readonly queue = this.connection
    ? new Queue("sabi-background-jobs", { connection: this.connection })
    : null;

  get configured() {
    return this.queue !== null;
  }

  async onModuleInit() {
    if (!this.connection) {
      this.logger.warn("Rumpty Redis is not configured; background jobs are disabled.");
      return;
    }

    await this.connection.connect();
    const response = await this.connection.ping();
    if (response !== "PONG") {
      throw new Error("Rumpty Redis did not return PONG during startup.");
    }
    this.logger.log("Rumpty Redis connection verified with PING.");
  }

  async onModuleDestroy() {
    await this.queue?.close();
    if (this.connection) await this.connection.quit();
  }
}
