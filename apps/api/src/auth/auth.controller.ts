import { Body, Controller, Get, Post, UseGuards, Req } from "@nestjs/common";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";
import type { AuthenticatedRequest } from "./auth.types";

class AuthDto {
  @IsEmail() @MaxLength(320) email!: string;
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
  @IsIn(["PREGNANT_PERSON", "MIDWIFE"]) role!: "PREGNANT_PERSON" | "MIDWIFE";
}

class RegisterDto extends AuthDto {
  @IsString() @MinLength(2) @MaxLength(120) displayName!: string;
  @IsOptional() @IsString() @MaxLength(120) inviteCode?: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post("login")
  login(@Body() body: AuthDto) {
    return this.auth.login(body.email, body.password, body.role);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.me(request.auth.userId);
  }
}
