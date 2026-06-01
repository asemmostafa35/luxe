import { Router } from 'express';
import { createOrder, getOrders, getOrder, updateOrderStatus, getMyOrders, trackOrder } from '../controllers/orderController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
export default Router()
  .post('/', optionalAuth, createOrder)
  .get('/', authenticate, requireAdmin, getOrders)
  .get('/my-orders', authenticate, getMyOrders)
  .get('/track', trackOrder)
  .get('/:id', authenticate, getOrder)
  .patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);
