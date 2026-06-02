import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../server";
import { authenticate } from "../middleware/auth";
import { requirePermission, requireStaff } from "../middleware/rbac";
import { sanitizeUserPatch } from "../lib/rbac/userUpdates";

const router = Router();

router.use(authenticate, requireStaff);

// ─── Customers ───────────────────────────────────────────────────────────────
router.get(
  "/users",
  requirePermission("customers:read"),
  async (req, res, next) => {
    try {
      const { page = "1", limit = "20", search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: "insensitive" } },
          { firstName: { contains: search as string, mode: "insensitive" } },
        ];
      }
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isEmailVerified: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);
      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/users/:id",
  requirePermission("customers:write"),
  async (req, res, next) => {
    try {
      const actor = (req as any).user;
      const target = await prisma.user.findUnique({
        where: { id: req.params.id },
      });
      if (!target) {
        return res.status(404).json({ error: "User not found" });
      }

      const { data, error } = sanitizeUserPatch(
        { userId: actor.userId, role: actor.role },
        { id: target.id, role: target.role },
        req.body,
      );
      if (error) {
        return res.status(403).json({ error });
      }
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: data as {
          role?: Role;
          isActive?: boolean;
          firstName?: string;
          lastName?: string;
          phone?: string | null;
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      });
      res.json(user);
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "";
      if (
        message.includes("invalid input value for enum") ||
        message.includes("Role")
      ) {
        return res.status(400).json({
          error:
            "Invalid role for database. Run migrations: npx prisma db push",
        });
      }
      next(e);
    }
  },
);

// ─── Inventory ───────────────────────────────────────────────────────────────
router.get(
  "/inventory",
  requirePermission("inventory:read"),
  async (req, res, next) => {
    try {
      const variants = await prisma.productVariant.findMany({
        where: { stock: { lte: 10 } },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              images: {
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                take: 1,
                select: { url: true },
              },
            },
          },
        },
        orderBy: { stock: "asc" },
      });
      res.json(variants);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/inventory/:variantId",
  requirePermission("inventory:write"),
  async (req, res, next) => {
    try {
      const v = await prisma.productVariant.update({
        where: { id: req.params.variantId },
        data: { stock: req.body.stock },
      });
      res.json(v);
    } catch (e) {
      next(e);
    }
  },
);

// ─── Contact messages ──────────────────────────────────────────────────────────
router.get(
  "/contact-messages",
  requirePermission("settings:read"),
  async (req, res, next) => {
    try {
      const msgs = await prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json(msgs);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/contact-messages/:id/read",
  requirePermission("settings:write"),
  async (req, res, next) => {
    try {
      await prisma.contactMessage.update({
        where: { id: req.params.id },
        data: { isRead: true },
      });
      res.json({ message: "Marked as read" });
    } catch (e) {
      next(e);
    }
  },
);

// ─── Announcements ─────────────────────────────────────────────────────────────
router.get(
  "/announcements",
  requirePermission("settings:read"),
  async (req, res, next) => {
    try {
      const a = await prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json(a);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/announcements",
  requirePermission("settings:write"),
  async (req, res, next) => {
    try {
      const a = await prisma.announcement.create({ data: req.body });
      res.status(201).json(a);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/announcements/:id",
  requirePermission("settings:write"),
  async (req, res, next) => {
    try {
      const a = await prisma.announcement.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json(a);
    } catch (e) {
      next(e);
    }
  },
);

// ─── Store settings ────────────────────────────────────────────────────────────
router.get(
  "/settings",
  requirePermission("settings:read"),
  async (_req, res, next) => {
    try {
      let settings = await prisma.storeSettings.findUnique({
        where: { id: "default" },
      });
      if (!settings) {
        settings = await prisma.storeSettings.create({
          data: {
            id: "default",
            storeName: "ZANE",
            contactEmail: "hello@zanefashion.com",
          },
        });
      }
      const announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      res.json({ settings, announcements });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/settings",
  requirePermission("settings:write"),
  async (req, res, next) => {
    try {
      const { storeName, contactEmail, announcementEnabled, activeAnnouncementId } =
        req.body;
      const settings = await prisma.storeSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          storeName: storeName ?? "ZANE",
          contactEmail: contactEmail ?? "hello@zanefashion.com",
          announcementEnabled: announcementEnabled ?? true,
          activeAnnouncementId: activeAnnouncementId ?? null,
        },
        update: {
          ...(storeName !== undefined && { storeName }),
          ...(contactEmail !== undefined && { contactEmail }),
          ...(announcementEnabled !== undefined && { announcementEnabled }),
          ...(activeAnnouncementId !== undefined && { activeAnnouncementId }),
        },
      });
      res.json(settings);
    } catch (e) {
      next(e);
    }
  },
);

// Public storefront settings (no auth)
export const publicSettingsRouter = Router();
publicSettingsRouter.get("/store", async (_req, res, next) => {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });
    let announcement = null;
    if (settings?.announcementEnabled && settings.activeAnnouncementId) {
      announcement = await prisma.announcement.findFirst({
        where: {
          id: settings.activeAnnouncementId,
          isActive: true,
        },
      });
    }
    if (!announcement && settings?.announcementEnabled) {
      announcement = await prisma.announcement.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    }
    res.json({
      storeName: settings?.storeName ?? "ZANE",
      contactEmail: settings?.contactEmail ?? "hello@zanefashion.com",
      announcementEnabled: settings?.announcementEnabled ?? true,
      announcement,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
