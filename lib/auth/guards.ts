import "server-only";

import { auth } from "@/auth";
import type { Permission, Role } from "./permissions";
import { hasPermission } from "./permissions";

export class AuthorizationError extends Error {
  constructor(public readonly code: "AUTH_REQUIRED" | "FORBIDDEN") {
    super(code);
  }
}

export async function requireActiveUser() {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") throw new AuthorizationError("AUTH_REQUIRED");
  return session.user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireActiveUser();
  if (!hasPermission(user.role as Role, permission)) throw new AuthorizationError("FORBIDDEN");
  return user;
}

export function assertOwnershipOrPermission({ ownerId, actorId, actorRole, permission }: {
  ownerId: string;
  actorId: string;
  actorRole: Role;
  permission: Permission;
}) {
  if (ownerId === actorId || hasPermission(actorRole, permission)) return;
  throw new AuthorizationError("FORBIDDEN");
}
