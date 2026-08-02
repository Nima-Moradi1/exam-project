export const permissions = [
  "category:read", "category:create", "category:update", "category:delete", "category:move",
  "exam:read", "exam:create", "exam:update", "exam:delete", "exam:publish",
  "question:create", "question:update", "question:delete",
  "resource:manage", "media:manage",
  "user:read", "user:update", "user:suspend", "user:role",
  "attempt:read:any", "attempt:grade", "attempt:cancel",
  "exam-request:read:any", "exam-request:update",
  "audit:read", "settings:manage"
] as const;

export type Permission = (typeof permissions)[number];
export type Role = "USER" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";

const userPermissions: readonly Permission[] = ["category:read", "exam:read"];
const managerPermissions: readonly Permission[] = [
  ...userPermissions,
  "category:create", "category:update", "category:delete", "category:move",
  "exam:create", "exam:update", "exam:delete", "exam:publish",
  "question:create", "question:update", "question:delete", "resource:manage", "media:manage"
];
const adminPermissions: readonly Permission[] = [
  ...managerPermissions,
  "user:read", "user:update", "user:suspend", "user:role",
  "attempt:read:any", "attempt:grade", "attempt:cancel", "audit:read", "settings:manage"
  , "exam-request:read:any", "exam-request:update"
];

export function hasPermission(role: Role, permission: Permission) {
  if (role === "SUPER_ADMIN") return true;
  const granted = role === "ADMIN" ? adminPermissions : role === "CONTENT_MANAGER" ? managerPermissions : userPermissions;
  return granted.includes(permission);
}

export function canManageRole(actor: Role, target: Role) {
  if (actor === "SUPER_ADMIN") return true;
  return actor === "ADMIN" && target !== "SUPER_ADMIN";
}
