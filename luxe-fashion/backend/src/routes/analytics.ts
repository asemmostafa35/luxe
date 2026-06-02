import { Router } from 'express';
import { getDashboardStats, getSalesReport } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireStaff } from '../middleware/rbac';
export default Router()
  .get('/dashboard', authenticate, requireStaff, requirePermission('analytics:read'), getDashboardStats)
  .get('/sales', authenticate, requireStaff, requirePermission('analytics:read'), getSalesReport);
