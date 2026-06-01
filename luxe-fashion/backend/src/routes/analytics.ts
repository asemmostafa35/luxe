import { Router } from 'express';
import { getDashboardStats, getSalesReport } from '../controllers/analyticsController';
import { authenticate, requireAdmin } from '../middleware/auth';
export default Router()
  .get('/dashboard', authenticate, requireAdmin, getDashboardStats)
  .get('/sales', authenticate, requireAdmin, getSalesReport);
