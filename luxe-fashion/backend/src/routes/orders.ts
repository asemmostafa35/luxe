import { Router } from 'express';
import { createOrder, getOrders, getOrder, updateOrderStatus, getMyOrders, trackOrder } from '../controllers/orderController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requirePermission, requireStaff } from '../middleware/rbac';
export default Router()
  .post('/', optionalAuth, createOrder)
  .get('/', authenticate, requireStaff, requirePermission('orders:read'), getOrders)
  .get('/my-orders', authenticate, getMyOrders)
  .get('/track', trackOrder)
  .get('/:id', authenticate, getOrder)
  .patch('/:id/status', authenticate, requireStaff, requirePermission('orders:write'), updateOrderStatus);
