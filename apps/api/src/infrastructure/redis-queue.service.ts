import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { redisTlsOptionsFromConfig } from "./redis-tls";

@Injectable()
export class RedisQueueService implements OnModuleDestroy {
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

  async onModuleDestroy() {
    await this.queue?.close();
    if (this.connection) await this.connection.quit();
  }
}
