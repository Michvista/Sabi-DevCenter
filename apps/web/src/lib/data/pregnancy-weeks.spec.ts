import { describe, expect, it } from "vitest";
import { getPregnancyWeek, pregnancyWeeks } from "./pregnancy-weeks";

describe("pregnancy week guides", () => {
  it("provides an individually addressable guide for all 42 weeks", () => {
    expect(pregnancyWeeks).toHaveLength(42);
    expect(pregnancyWeeks.map(({ week }) => week)).toEqual(
      Array.from({ length: 42 }, (_, index) => index + 1),
    );
    expect(new Set(pregnancyWeeks.map(({ title }) => title)).size).toBe(42);
    expect(
      pregnancyWeeks.every(({ citationPages, reviewStatus }) =>
        citationPages.length
          ? reviewStatus === "clinician-review-required"
          : true,
      ),
    ).toBe(true);
  });

  it("clamps dates outside the guide range to the nearest guide", () => {
    expect(getPregnancyWeek(0).week).toBe(1);
    expect(getPregnancyWeek(41).week).toBe(41);
    expect(getPregnancyWeek(43).week).toBe(42);
    expect(getPregnancyWeek(33).week).toBe(33);
  });

  it("uses cached, page-cited book excerpts for weeks 1 to 40 only", () => {
    expect(
      pregnancyWeeks
        .slice(0, 40)
        .every(
          ({ bookNote, citationPages, reviewStatus }) =>
            Boolean(bookNote) &&
            citationPages.length > 0 &&
            reviewStatus === "clinician-review-required",
        ),
    ).toBe(true);
    expect(pregnancyWeeks.slice(40).every(({ bookNote }) => !bookNote)).toBe(
      true,
    );
    expect(
      pregnancyWeeks.slice(0, 40).map(({ citationPages }) => citationPages[0]),
    ).toEqual([
      37, 38, 52, 64, 75, 89, 103, 117, 130, 142, 156, 170, 183, 196, 210, 223,
      237, 250, 262, 276, 287, 301, 315, 328, 339, 351, 362, 373, 384, 396, 407,
      419, 431, 443, 455, 465, 478, 490, 499, 511,
    ]);
  });
});
