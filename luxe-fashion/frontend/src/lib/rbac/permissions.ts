export type StaffRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";

export type Role = StaffRole | "USER";

export type Permission =
  | "dashboard:read"
  | "analytics:read"
  | "orders:read"
  | "orders:write"
  | "products:read"
  | "products:write"
  | "categories:read"
  | "categories:write"
  | "inventory:read"
  | "inventory:write"
  | "reviews:read"
  | "reviews:write"
  | "banners:read"
  | "banners:write"
  | "coupons:read"
  | "coupons:write"
  | "customers:read"
  | "customers:write"
  | "settings:read"
  | "settings:write"
  | "roles:assign"
  | "roles:assign_elevated";

export const STAFF_ROLES: StaffRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "VIEWER",
];

export const ROLE_LEVEL: Record<Role, number> = {
  USER: 1,
  VIEWER: 2,
  EDITOR: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

export const ALL_ROLES: Role[] = [
  "USER",
  "VIEWER",
  "EDITOR",
  "ADMIN",
  "SUPER_ADMIN",
];

export function isStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function isValidRole(role: string): role is Role {
  return ALL_ROLES.includes(role as Role);
}

const EDITOR_PERMISSIONS: Permission[] = [
  "dashboard:read",
  "analytics:read",
  "orders:read",
  "products:read",
  "products:write",
  "categories:read",
  "categories:write",
  "inventory:read",
  "inventory:write",
  "reviews:read",
  "reviews:write",
  "banners:read",
  "banners:write",
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...EDITOR_PERMISSIONS,
  "orders:write",
  "coupons:read",
  "coupons:write",
  "customers:read",
  "customers:write",
  "settings:read",
  "settings:write",
  "roles:assign",
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: [],
  VIEWER: ["analytics:read"],
  EDITOR: EDITOR_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  SUPER_ADMIN: [...ADMIN_PERMISSIONS, "roles:assign_elevated"],
};

export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] ?? [];
}

export function hasPermission(role: string, permission: Permission): boolean {
  return getPermissions(role).includes(permission);
}

export function canAccessAdminRoute(role: string, pathname: string): boolean {
  if (!isStaffRole(role)) return false;

  if (role === "VIEWER") {
    return (
      pathname === "/admin/analytics" ||
      pathname.startsWith("/admin/analytics/")
    );
  }

  const routePermission: Record<string, Permission> = {
    "/admin": "dashboard:read",
    "/admin/analytics": "analytics:read",
    "/admin/orders": "orders:read",
    "/admin/products": "products:read",
    "/admin/categories": "categories:read",
    "/admin/inventory": "inventory:read",
    "/admin/customers": "customers:read",
    "/admin/coupons": "coupons:read",
    "/admin/reviews": "reviews:read",
    "/admin/banners": "banners:read",
    "/admin/settings": "settings:read",
  };

  if (pathname === "/admin" || pathname === "/admin/") {
    return hasPermission(role, "dashboard:read");
  }

  const match = Object.keys(routePermission)
    .filter((route) => route !== "/admin")
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!match) return false;
  return hasPermission(role, routePermission[match]);
}

export function getDefaultAdminLanding(role: string): string {
  if (role === "VIEWER") return "/admin/analytics";
  return "/admin";
}

export function canAssignRole(
  actorRole: string,
  targetCurrentRole: string,
  newRole: string,
): { allowed: boolean; reason?: string } {
  if (!isValidRole(newRole)) {
    return { allowed: false, reason: "Invalid role value" };
  }

  if (actorRole === "SUPER_ADMIN") {
    return { allowed: true };
  }

  if (!hasPermission(actorRole, "roles:assign")) {
    return {
      allowed: false,
      reason: "Insufficient permissions to change roles",
    };
  }

  const actorLevel = ROLE_LEVEL[actorRole as Role] ?? 0;
  const newLevel = ROLE_LEVEL[newRole as Role] ?? 0;
  const targetLevel = ROLE_LEVEL[targetCurrentRole as Role] ?? 0;

  if (newLevel >= actorLevel) {
    return {
      allowed: false,
      reason: "You cannot assign a role at or above your own level",
    };
  }

  if (targetLevel >= actorLevel) {
    return {
      allowed: false,
      reason: "You cannot modify users at or above your own level",
    };
  }

  return { allowed: true };
}

export function assignableRolesForActor(
  actorRole: string,
  targetRole: string,
): string[] {
  if (actorRole === "SUPER_ADMIN") {
    return ALL_ROLES;
  }

  if (!hasPermission(actorRole, "roles:assign")) {
    return [];
  }

  const actorLevel = ROLE_LEVEL[actorRole as Role] ?? 0;
  const allowed = ALL_ROLES.filter((r) => ROLE_LEVEL[r] < actorLevel);
  if (isValidRole(targetRole) && !allowed.includes(targetRole as Role)) {
    return [targetRole, ...allowed];
  }
  return allowed;
}
