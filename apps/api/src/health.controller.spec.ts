import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  const controller = new HealthController();

  it("returns a successful readiness response at the deployment root", () => {
    expect(controller.getRootHealth()).toEqual({
      status: "ok",
      service: "sabi-api",
    });
  });

  it("keeps the explicit health endpoint available", () => {
    expect(controller.getHealth()).toEqual({
      status: "ok",
      service: "sabi-api",
    });
  });
});
