import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({ where: { userId: req.user.userId }, include: { product: { include: { images: { where: { isPrimary: true }, take: 1 }, category: { select: { name: true, slug: true } } } } } });
    res.json(items);
  } catch(e) { next(e); }
});
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const item = await prisma.wishlistItem.create({ data: { userId: req.user.userId, productId: req.body.productId } });
    res.status(201).json(item);
  } catch(e) { next(e); }
});
router.delete('/:productId', authenticate, async (req: any, res, next) => {
  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user.userId, productId: req.params.productId } });
    res.json({ message: 'Removed' });
  } catch(e) { next(e); }
});
export default router;
