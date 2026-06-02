import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireStaff } from '../middleware/rbac';
const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({ where: { isActive: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] }, orderBy: { sortOrder: 'asc' } });
    res.json(banners);
  } catch(e) { next(e); }
});
router.post('/', authenticate, requireStaff, requirePermission('banners:write'), async (req, res, next) => {
  try {
    const banner = await prisma.banner.create({ data: req.body });
    res.status(201).json(banner);
  } catch(e) { next(e); }
});
router.put('/:id', authenticate, requireStaff, requirePermission('banners:write'), async (req, res, next) => {
  try {
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body });
    res.json(banner);
  } catch(e) { next(e); }
});
router.delete('/:id', authenticate, requireStaff, requirePermission('banners:write'), async (req, res, next) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch(e) { next(e); }
});
export default router;
