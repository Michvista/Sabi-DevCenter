import type { UserRole } from "../database/entities/user.entity";

export type AuthPrincipal = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export type AuthenticatedRequest = {
  headers: { authorization?: string };
  auth: AuthPrincipal;
};
