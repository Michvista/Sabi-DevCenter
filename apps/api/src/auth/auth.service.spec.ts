import { afterEach, describe, expect, it } from "vitest";
import { AuthService } from "./auth.service";
import type { DataSource } from "typeorm";
import type { UserEntity } from "../database/entities/user.entity";

function makeAuth() {
  const users: UserEntity[] = [];
  const repo = {
    existsBy: async ({ email }: { email: string }) =>
      users.some((user) => user.email === email),
    create: (values: Partial<UserEntity>) => values as UserEntity,
    save: async (user: UserEntity) => {
      users.push(user);
      return user;
    },
    findOne: async ({ where }: { where: { id: string } }) =>
      users.find((user) => user.id === where.id) ?? null,
    createQueryBuilder: () => {
      let email = "";
      return {
        addSelect() {
          return this;
        },
        where(_sql: string, params: { email: string }) {
          email = params.email;
          return this;
        },
        getOne: async () => users.find((user) => user.email === email) ?? null,
      };
    },
  };
  const dataSource = {
    isInitialized: true,
    getRepository: () => repo,
  } as unknown as DataSource;
  return new AuthService(dataSource);
}

describe("AuthService", () => {
  afterEach(() => {
    delete process.env.AUTH_JWT_SECRET;
    delete process.env.MIDWIFE_INVITE_CODE;
  });

  it("registers a patient with a password hash and verifies the signed session", async () => {
    process.env.AUTH_JWT_SECRET =
      "unit-test-secret-with-at-least-32-characters";
    const auth = makeAuth();
    const result = await auth.register({
      displayName: "Test Person",
      email: "TEST@example.test",
      password: "LongTestPassword123!",
      role: "PREGNANT_PERSON",
    });
    expect(result.user).toMatchObject({
      email: "test@example.test",
      role: "PREGNANT_PERSON",
    });
    expect(auth.verifyToken(result.token)).toMatchObject({
      userId: result.user.id,
      email: "test@example.test",
    });
    await expect(
      auth.login("test@example.test", "wrong-password", "PREGNANT_PERSON"),
    ).rejects.toThrow();
    await expect(
      auth.login("test@example.test", "LongTestPassword123!", "MIDWIFE"),
    ).rejects.toThrow();
    await expect(
      auth.login(
        "test@example.test",
        "LongTestPassword123!",
        "PREGNANT_PERSON",
      ),
    ).resolves.toMatchObject({ user: result.user });
  });

  it("requires the configured clinic invitation for midwife registration", async () => {
    process.env.AUTH_JWT_SECRET =
      "unit-test-secret-with-at-least-32-characters";
    process.env.MIDWIFE_INVITE_CODE = "clinic-code";
    const auth = makeAuth();
    await expect(
      auth.register({
        displayName: "Care Worker",
        email: "nurse@example.test",
        password: "LongTestPassword123!",
        role: "MIDWIFE",
      }),
    ).rejects.toThrow(/invitation/);
    await expect(
      auth.register({
        displayName: "Care Worker",
        email: "nurse@example.test",
        password: "LongTestPassword123!",
        role: "MIDWIFE",
        inviteCode: "clinic-code",
      }),
    ).resolves.toMatchObject({ user: { role: "MIDWIFE" } });
  });
});
