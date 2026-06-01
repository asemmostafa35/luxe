import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const items = await prisma.cartItem.findMany({ where: { userId: req.user.userId }, include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } }, variant: true } });
    res.json(items);
  } catch(e) { next(e); }
});
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const item = await prisma.cartItem.upsert({ where: { userId_productId_variantId: { userId: req.user.userId, productId, variantId: variantId || null } }, update: { quantity: { increment: quantity } }, create: { userId: req.user.userId, productId, variantId, quantity } });
    res.json(item);
  } catch(e) { next(e); }
});
router.patch('/:id', authenticate, async (req: any, res, next) => {
  try {
    const item = await prisma.cartItem.update({ where: { id: req.params.id }, data: { quantity: req.body.quantity } });
    res.json(item);
  } catch(e) { next(e); }
});
router.delete('/:id', authenticate, async (req: any, res, next) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Removed' });
  } catch(e) { next(e); }
});
router.delete('/', authenticate, async (req: any, res, next) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.userId } });
    res.json({ message: 'Cart cleared' });
  } catch(e) { next(e); }
});
export default router;
