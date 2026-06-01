import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import bcrypt from 'bcryptjs';
const router = Router();
router.use(authenticate);
router.put('/profile', async (req: any, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;
    const user = await prisma.user.update({ where: { id: req.user.userId }, data: { firstName, lastName, phone, avatar } });
    res.json(user);
  } catch(e) { next(e); }
});
router.put('/password', async (req: any, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ error: 'Current password incorrect' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.userId }, data: { password: hashed } });
    res.json({ message: 'Password updated' });
  } catch(e) { next(e); }
});
router.get('/addresses', async (req: any, res, next) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user.userId } });
    res.json(addresses);
  } catch(e) { next(e); }
});
router.post('/addresses', async (req: any, res, next) => {
  try {
    const address = await prisma.address.create({ data: { ...req.body, userId: req.user.userId } });
    res.status(201).json(address);
  } catch(e) { next(e); }
});
router.delete('/addresses/:id', async (req: any, res, next) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch(e) { next(e); }
});
export default router;
