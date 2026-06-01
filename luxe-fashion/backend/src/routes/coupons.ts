import { Router } from 'express';
import { prisma } from '../server';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/validate', async (req: any, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const now = new Date();
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      },
    });
    if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon' });
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }
    if (coupon.minOrderAmount && orderAmount && Number(orderAmount) < Number(coupon.minOrderAmount)) {
      return res.status(400).json({ error: `Minimum order amount is $${coupon.minOrderAmount}` });
    }
    res.json(coupon);
  } catch (e) { next(e); }
});

router.get('/', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (e) { next(e); }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { code, ...rest } = req.body;
    const coupon = await prisma.coupon.create({
      data: { ...rest, code: code.toUpperCase() },
    });
    res.status(201).json(coupon);
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
    res.json(coupon);
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Coupon deleted' });
  } catch (e) { next(e); }
});

export default router;
