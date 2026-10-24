import { describe, expect, it } from "vitest";
import {
  isCompleteWeekNotesCache,
  isValidWeekNote,
} from "./week-notes-cache.mjs";

describe("cached weekly book notes", () => {
  it("accepts a fully cited set of all 40 weeks", () => {
    const cache = {
      notes: Array.from({ length: 40 }, (_, index) => ({
        week: index + 1,
        summary: `Week ${index + 1} note`,
        citationPages: [index + 10],
      })),
    };
    expect(isCompleteWeekNotesCache(cache)).toBe(true);
  });

  it("rejects missing weeks, blank summaries and missing or invalid citations", () => {
    const valid = Array.from({ length: 40 }, (_, index) => ({
      week: index + 1,
      summary: `Week ${index + 1} note`,
      citationPages: [index + 10],
    }));
    expect(isCompleteWeekNotesCache({ notes: valid.slice(0, 39) })).toBe(false);
    expect(
      isCompleteWeekNotesCache({
        notes: valid.map((note, index) =>
          index === 4 ? { ...note, summary: " " } : note,
        ),
      }),
    ).toBe(false);
    expect(
      isCompleteWeekNotesCache({
        notes: valid.map((note, index) =>
          index === 4 ? { ...note, citationPages: [0] } : note,
        ),
      }),
    ).toBe(false);
  });

  it("validates an individual week so partial runs can resume safely", () => {
    expect(
      isValidWeekNote(
        { week: 18, summary: "A short note.", citationPages: [244] },
        18,
      ),
    ).toBe(true);
    expect(
      isValidWeekNote(
        { week: 18, summary: "A short note.", citationPages: [244] },
        19,
      ),
    ).toBe(false);
  });
});
