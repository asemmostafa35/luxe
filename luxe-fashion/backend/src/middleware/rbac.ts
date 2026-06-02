import { Request, Response, NextFunction } from "express";
import {
  hasPermission,
  isStaffRole,
  Permission,
} from "../lib/rbac/permissions";

export const requireStaff = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;
  if (!user || !isStaffRole(user.role)) {
    return res.status(403).json({ error: "Staff access required" });
  }
  next();
};

export const requirePermission =
  (...permissions: Permission[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !isStaffRole(user.role)) {
      return res.status(403).json({ error: "Staff access required" });
    }

    const allowed = permissions.some((p) => hasPermission(user.role, p));
    if (!allowed) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
