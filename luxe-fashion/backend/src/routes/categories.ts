import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireStaff } from '../middleware/rbac';

const router = Router();

/** Storefront: active categories only (inactive hidden from customers). */
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: { _count: { select: { products: true } } },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (e) {
    next(e);
  }
});

/** Admin: all categories including inactive. */
router.get(
  '/manage',
  authenticate,
  requireStaff,
  requirePermission('categories:read'),
  async (req, res, next) => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          children: { include: { _count: { select: { products: true } } } },
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: 'asc' },
      });
      res.json(categories);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  '/',
  authenticate,
  requireStaff,
  requirePermission('categories:write'),
  async (req, res, next) => {
    try {
      const { name, description, image, parentId, isActive } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cat = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          image,
          parentId: parentId || null,
          isActive: isActive !== false,
        },
      });
      res.status(201).json(cat);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  '/:id',
  authenticate,
  requireStaff,
  requirePermission('categories:write'),
  async (req, res, next) => {
    try {
      const { name, description, image, parentId, isActive, sortOrder } = req.body;
      const data: Record<string, unknown> = {};
      if (name !== undefined) {
        data.name = name;
        data.slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      if (description !== undefined) data.description = description;
      if (image !== undefined) data.image = image;
      if (parentId !== undefined) data.parentId = parentId || null;
      if (isActive !== undefined) data.isActive = Boolean(isActive);
      if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

      const cat = await prisma.category.update({
        where: { id: req.params.id },
        data,
      });
      res.json(cat);
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  '/:id',
  authenticate,
  requireStaff,
  requirePermission('categories:write'),
  async (req, res, next) => {
    try {
      await prisma.category.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.json({ message: 'Deleted' });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
