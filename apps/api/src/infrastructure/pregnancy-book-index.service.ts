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
    citationPages: number[];
    sections: Array<{
      title: string;
      summary: string;
      citationPages: number[];
    }>;
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
      index.chunks.some(
        (chunk) =>
          chunk.embedding.length !== 768 ||
          !chunk.citationPages.length ||
          chunk.sections.length < 2,
      )
    )
      throw new Error(
        "Pregnancy book index is incomplete or has invalid embeddings.",
      );
    const rows = index.chunks.map((chunk) => ({
        week: chunk.week,
        page: chunk.page,
        content: JSON.stringify({
          version: 2,
          sections: chunk.sections,
          citationPages: chunk.citationPages,
        }),
        embedding: chunk.embedding,
        model: index.model,
      }));
    const existing = await repo.find({ select: ["week", "content", "model"] });
    const existingByWeek = new Map(existing.map((row) => [row.week, row]));
    const alreadyCurrent =
      existing.length === rows.length &&
      rows.every((row) => {
        const current = existingByWeek.get(row.week);
        return current?.content === row.content && current.model === row.model;
      });
    if (alreadyCurrent) return;
    await repo.upsert(rows, ["week"]);
    this.logger.log(
      `Stored or refreshed ${index.chunks.length} page-cited pregnancy-week guides in PostgreSQL.`,
    );
  }
}
