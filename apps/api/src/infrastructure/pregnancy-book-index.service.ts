import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Optional,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DataSource } from "typeorm";
import { PregnancyBookChunkEntity } from "../database/entities/pregnancy-book-chunk.entity";

type BookIndex = {
  model: string;
  chunks: Array<{
    week: number;
    page: number;
    text: string;
    embedding: number[];
  }>;
};

@Injectable()
export class PregnancyBookIndexService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PregnancyBookIndexService.name);
  constructor(
    @Optional() @InjectDataSource() private readonly db?: DataSource,
  ) {}

  async onApplicationBootstrap() {
    if (!this.db?.isInitialized) return;
    const repo = this.db.getRepository(PregnancyBookChunkEntity);
    if ((await repo.count()) > 0) return;
    const path = resolve(__dirname, "../data/pregnancy-week-book-index.json");
    if (!existsSync(path)) {
      this.logger.warn(
        "Pregnancy book index is not bundled; run npm run rag:embed-book before deployment.",
      );
      return;
    }
    const index = JSON.parse(readFileSync(path, "utf8")) as BookIndex;
    if (
      index.chunks.length !== 40 ||
      index.chunks.some((chunk) => chunk.embedding.length !== 768)
    )
      throw new Error(
        "Pregnancy book index is incomplete or has invalid embeddings.",
      );
    await repo.insert(
      index.chunks.map((chunk) => ({
        week: chunk.week,
        page: chunk.page,
        content: chunk.text,
        embedding: chunk.embedding,
        model: index.model,
      })),
    );
    this.logger.log(
      `Stored ${index.chunks.length} page-cited pregnancy book chunks in PostgreSQL.`,
    );
  }
}
