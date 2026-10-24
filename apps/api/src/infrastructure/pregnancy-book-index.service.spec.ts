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
        citationPages: number[];
        sections: Array<{
          title: string;
          summary: string;
          citationPages: number[];
        }>;
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
          chunk.embedding.length === 768 &&
          chunk.sections.length >= 2 &&
          chunk.sections.every(
            (section) =>
              section.summary.length > 20 &&
              section.citationPages.length > 0 &&
              section.citationPages.every((page) =>
                chunk.citationPages.includes(page),
              ),
          ),
      ),
    ).toBe(true);
  });
});
