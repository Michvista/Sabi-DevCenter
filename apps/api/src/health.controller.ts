import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get()
  getRootHealth() {
    return { status: "ok", service: "sabi-api" };
  }

  @Get("health")
  getHealth() {
    return { status: "ok", service: "sabi-api" };
  }
}
