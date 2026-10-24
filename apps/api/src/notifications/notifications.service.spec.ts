import { describe, expect, it } from "vitest";
import { lagosDateAfterDays } from "./notifications.service";

describe("Lagos notification dates", () => {
  it("calculates calendar dates using Africa/Lagos rather than the server timezone", () => {
    expect(lagosDateAfterDays(1, new Date("2026-10-20T23:00:00.000Z"))).toBe(
      "2026-10-22",
    );
  });

  it("handles month and year boundaries", () => {
    expect(lagosDateAfterDays(1, new Date("2026-12-31T10:00:00.000Z"))).toBe(
      "2027-01-01",
    );
  });
});
