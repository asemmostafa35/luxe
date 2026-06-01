import { Router } from 'express';
import { prisma } from '../server';
const router = Router();
router.post('/', async (req, res, next) => {
  try {
    const msg = await prisma.contactMessage.create({ data: req.body });
    res.status(201).json({ message: 'Message sent', id: msg.id });
  } catch(e) { next(e); }
});
export default router;
