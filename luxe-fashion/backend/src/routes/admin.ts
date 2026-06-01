import { Router } from 'express';
import { prisma } from '../server';
import { authenticate, requireAdmin } from '../middleware/auth';
const router = Router();
router.use(authenticate, requireAdmin);
router.get('/users', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) where.OR = [{ email: { contains: search, mode: 'insensitive' } }, { firstName: { contains: search, mode: 'insensitive' } }];
    const [users, total] = await Promise.all([prisma.user.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, isEmailVerified: true, createdAt: true, _count: { select: { orders: true } } } }), prisma.user.count({ where })]);
    res.json({ users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch(e) { next(e); }
});
router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
    res.json(user);
  } catch(e) { next(e); }
});
router.get('/contact-messages', async (req, res, next) => {
  try {
    const msgs = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(msgs);
  } catch(e) { next(e); }
});
router.patch('/contact-messages/:id/read', async (req, res, next) => {
  try {
    await prisma.contactMessage.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ message: 'Marked as read' });
  } catch(e) { next(e); }
});
router.get('/announcements', async (req, res, next) => {
  try {
    const a = await prisma.announcement.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    res.json(a);
  } catch(e) { next(e); }
});
router.post('/announcements', async (req, res, next) => {
  try {
    const a = await prisma.announcement.create({ data: req.body });
    res.status(201).json(a);
  } catch(e) { next(e); }
});
router.get('/inventory', async (req, res, next) => {
  try {
    const variants = await prisma.productVariant.findMany({ where: { stock: { lte: 10 } }, include: { product: { select: { name: true, sku: true } } }, orderBy: { stock: 'asc' } });
    res.json(variants);
  } catch(e) { next(e); }
});
router.patch('/inventory/:variantId', async (req, res, next) => {
  try {
    const v = await prisma.productVariant.update({ where: { id: req.params.variantId }, data: { stock: req.body.stock } });
    res.json(v);
  } catch(e) { next(e); }
});
export default router;
