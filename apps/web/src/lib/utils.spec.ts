import { describe, expect, it } from "vitest";
import { daysUntil, pregnancyWeek } from "./utils";

describe("pregnancy helpers", () => {
  it("estimates pregnancy week from the due date", () => {
    expect(pregnancyWeek("2026-11-12", new Date("2026-10-15T12:00:00"))).toBe(
      36,
    );
  });
  it("keeps week values within the pregnancy range", () => {
    expect(pregnancyWeek("2027-10-15", new Date("2026-10-15"))).toBe(1);
    expect(pregnancyWeek("2026-01-01", new Date("2026-10-15"))).toBe(42);
  });
  it("calculates remaining days", () => {
    expect(daysUntil("2026-10-20", new Date("2026-10-15"))).toBe(5);
  });
});
