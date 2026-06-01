import { Router } from 'express';
import { prisma } from '../server';
const router = Router();
router.post('/subscribe', async (req, res, next) => {
  try {
    const sub = await prisma.newsletterSubscriber.upsert({ where: { email: req.body.email }, update: { isActive: true }, create: { email: req.body.email } });
    res.json({ message: 'Subscribed successfully' });
  } catch(e) { next(e); }
});
export default router;
