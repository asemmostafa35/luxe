import { Router } from 'express';
import { prisma } from '../server';
const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ where: { isActive: true }, include: { children: true, _count: { select: { products: true } } }, orderBy: { sortOrder: 'asc' } });
    res.json(categories);
  } catch(e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try {
    const { name, description, image, parentId } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat = await prisma.category.create({ data: { name, slug, description, image, parentId } });
    res.status(201).json(cat);
  } catch(e) { next(e); }
});
router.put('/:id', async (req, res, next) => {
  try {
    const cat = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json(cat);
  } catch(e) { next(e); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Deleted' });
  } catch(e) { next(e); }
});
export default router;
