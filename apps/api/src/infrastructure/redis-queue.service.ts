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

    // BullMQ may start the shared ioredis client as soon as Queue is created.
    // Calling connect() again while it is connecting throws and crashes Nest.
    if (this.connection.status === "wait" || this.connection.status === "end") {
      await this.connection.connect();
    } else if (this.connection.status !== "ready") {
      await new Promise<void>((resolve, reject) => {
        const onReady = () => {
          this.connection?.off("error", onError);
          resolve();
        };
        const onError = (error: Error) => {
          this.connection?.off("ready", onReady);
          reject(error);
        };
        this.connection?.once("ready", onReady);
        this.connection?.once("error", onError);
      });
    }
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
