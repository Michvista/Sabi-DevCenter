import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("one-time pregnancy book index", () => {
  it("contains one cited, embedded source chunk for each full-term week", () => {
    const path = resolve(__dirname, "../data/pregnancy-week-book-index.json");
    const index = JSON.parse(readFileSync(path, "utf8")) as {
      model: string;
      chunks: Array<{
        week: number;
        page: number;
        text: string;
        embedding: number[];
      }>;
    };
    expect(index.model).toBe("gemini-embedding-001");
    expect(index.chunks).toHaveLength(40);
    expect(index.chunks.map((chunk) => chunk.week)).toEqual(
      Array.from({ length: 40 }, (_, position) => position + 1),
    );
    expect(
      index.chunks.every(
        (chunk) =>
          chunk.page > 0 &&
          chunk.text.length > 0 &&
          chunk.embedding.length === 768,
      ),
    ).toBe(true);
  });
});
