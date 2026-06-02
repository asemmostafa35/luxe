import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireStaff } from '../middleware/rbac';
const router = Router();
router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({ where: { productId: req.params.productId, isApproved: true }, include: { user: { select: { firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(reviews);
  } catch(e) { next(e); }
});
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const review = await prisma.review.create({ data: { ...req.body, userId: req.user.userId } });
    const stats = await prisma.review.aggregate({ where: { productId: req.body.productId, isApproved: true }, _avg: { rating: true }, _count: true });
    await prisma.product.update({ where: { id: req.body.productId }, data: { avgRating: stats._avg.rating || 0, reviewCount: stats._count } });
    res.status(201).json(review);
  } catch(e) { next(e); }
});
router.patch('/:id/approve', authenticate, requireStaff, requirePermission('reviews:write'), async (req, res, next) => {
  try {
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { isApproved: true } });
    res.json(review);
  } catch(e) { next(e); }
});
router.delete('/:id', authenticate, requireStaff, requirePermission('reviews:write'), async (req, res, next) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch(e) { next(e); }
});
export default router;
