import {
  ConflictException,
  Injectable,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import {
  createHmac,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import type { DataSource } from "typeorm";
import { UserEntity, type UserRole } from "../database/entities/user.entity";
import type { AuthPrincipal } from "./auth.types";

type TokenPayload = AuthPrincipal & { iat: number; exp: number };

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function derivePassword(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) =>
      error ? reject(error) : resolve(key as Buffer),
    );
  });
}

@Injectable()
export class AuthService {
  constructor(
    @Optional() @InjectDataSource() private readonly dataSource?: DataSource,
  ) {}

  private repository() {
    if (!this.dataSource?.isInitialized) {
      throw new ServiceUnavailableException(
        "Account storage is not connected yet.",
      );
    }
    return this.dataSource.getRepository(UserEntity);
  }

  private jwtSecret() {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException(
        "Secure account sessions are not configured.",
      );
    }
    return secret;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16);
    const hash = await derivePassword(password, salt);
    return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
  }

  private async passwordMatches(password: string, stored: string) {
    const [algorithm, saltText, hashText] = stored.split("$");
    if (algorithm !== "scrypt" || !saltText || !hashText) return false;
    const expected = Buffer.from(hashText, "base64url");
    const actual = await derivePassword(
      password,
      Buffer.from(saltText, "base64url"),
    );
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private createToken(user: UserEntity) {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      iat: now,
      exp: now + 60 * 60 * 12,
    };
    const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}`;
    return `${unsigned}.${sign(unsigned, this.jwtSecret())}`;
  }

  verifyToken(token: string): AuthPrincipal {
    const secret = this.jwtSecret();
    const [header, body, signature, extra] = token.split(".");
    if (!header || !body || !signature || extra) {
      throw new UnauthorizedException("Sign in again to continue.");
    }
    const unsigned = `${header}.${body}`;
    const expected = Buffer.from(sign(unsigned, secret));
    const actual = Buffer.from(signature);
    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      throw new UnauthorizedException("Sign in again to continue.");
    }
    try {
      const payload = JSON.parse(
        Buffer.from(body, "base64url").toString(),
      ) as TokenPayload;
      if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException(
          "Your session has expired. Sign in again.",
        );
      }
      return {
        userId: payload.userId,
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Sign in again to continue.");
    }
  }

  async register(input: {
    displayName: string;
    email: string;
    password: string;
    role: "PREGNANT_PERSON" | "MIDWIFE";
    inviteCode?: string;
  }) {
    if (input.role === "MIDWIFE") {
      const expected = process.env.MIDWIFE_INVITE_CODE;
      if (!expected || !input.inviteCode || input.inviteCode !== expected) {
        throw new UnauthorizedException(
          "A valid care-team invitation is required.",
        );
      }
    }
    const repository = this.repository();
    const email = input.email.trim().toLowerCase();
    if (await repository.existsBy({ email })) {
      throw new ConflictException("An account with this email already exists.");
    }
    const user = repository.create({
      id: randomUUID(),
      email,
      displayName: input.displayName.trim(),
      role: input.role as UserRole,
      passwordHash: await this.hashPassword(input.password),
    });
    await repository.save(user);
    return this.session(user);
  }

  async login(emailInput: string, password: string, role: UserRole) {
    const user = await this.repository()
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email: emailInput.trim().toLowerCase() })
      .getOne();
    if (
      !user ||
      user.role !== role ||
      !(await this.passwordMatches(password, user.passwordHash))
    ) {
      throw new UnauthorizedException(
        "Email, password or portal is incorrect.",
      );
    }
    return this.session(user);
  }

  async me(userId: string) {
    const user = await this.repository().findOne({ where: { id: userId } });
    if (!user)
      throw new UnauthorizedException("This account no longer exists.");
    return this.sessionUser(user);
  }

  private session(user: UserEntity) {
    return { token: this.createToken(user), user: this.sessionUser(user) };
  }

  private sessionUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
