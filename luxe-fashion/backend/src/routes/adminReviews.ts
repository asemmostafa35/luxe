import { Router } from 'express';
import { prisma } from '../server';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/reviews?page=1&limit=20&approved=pending|approved|all
router.get('/', async (req: any, res, next) => {
  try {
    const { page = '1', limit = '20', approved = 'all' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (approved === 'pending')  where.isApproved = false;
    if (approved === 'approved') where.isApproved = true;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user:    { select: { firstName: true, lastName: true, email: true, avatar: true } },
          product: { select: { name: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    res.json({
      reviews,
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
});

export default router;
