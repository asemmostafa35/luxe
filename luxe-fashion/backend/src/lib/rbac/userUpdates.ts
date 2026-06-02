import { Role } from "@prisma/client";
import { canAssignRole, isValidRole } from "./permissions";

const ALLOWED_PATCH_FIELDS = [
  "role",
  "isActive",
  "firstName",
  "lastName",
  "phone",
] as const;

export function sanitizeUserPatch(
  actor: { userId: string; role: string },
  target: { id: string; role: Role },
  body: Record<string, unknown>,
): { data: Partial<Record<(typeof ALLOWED_PATCH_FIELDS)[number], unknown>>; error?: string } {
  if (target.id === actor.userId) {
    if ("role" in body && body.role !== target.role) {
      return { data: {}, error: "You cannot change your own role" };
    }
    if ("isActive" in body && body.isActive === false) {
      return { data: {}, error: "You cannot deactivate your own account" };
    }
  }

  if ("role" in body && body.role !== undefined && body.role !== target.role) {
    const roleStr = String(body.role);
    if (!isValidRole(roleStr)) {
      return { data: {}, error: `Invalid role. Allowed: ${Object.values(Role).join(", ")}` };
    }
    const newRole = roleStr as Role;
    const check = canAssignRole(actor.role, target.role, newRole);
    if (!check.allowed) {
      return { data: {}, error: check.reason ?? "Role change not allowed" };
    }
  }

  const data: Partial<Record<(typeof ALLOWED_PATCH_FIELDS)[number], unknown>> = {};
  for (const key of ALLOWED_PATCH_FIELDS) {
    if (key in body) {
      if (key === "role" && body.role !== undefined) {
        const roleStr = String(body.role);
        if (!isValidRole(roleStr)) continue;
        data.role = roleStr as Role;
      } else {
        data[key] = body[key];
      }
    }
  }

  return { data };
}
