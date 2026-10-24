import { SafetyService } from "./safety.service";
import { describe, expect, it } from "vitest";

describe("SafetyService", () => {
  const service = new SafetyService();
  it("routes warning symptoms to urgent care", () => {
    expect(service.assess(["vaginal bleeding"]).level).toBe("urgent");
  });
  it("encourages care-team contact for unclassified symptoms", () => {
    expect(service.assess(["mild nausea"]).level).toBe("contact-care-team");
  });
  it("does not diagnose an empty assessment", () => {
    expect(service.assess([]).level).toBe("no-symptoms");
  });
});
