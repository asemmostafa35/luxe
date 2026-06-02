import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getFeatured, getNewArrivals, getBestSellers } from '../controllers/productController';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireStaff } from '../middleware/rbac';
export default Router()
  .get('/', getProducts)
  .get('/featured', getFeatured)
  .get('/new-arrivals', getNewArrivals)
  .get('/best-sellers', getBestSellers)
  .get('/:slug', getProduct)
  .post('/', authenticate, requireStaff, requirePermission('products:write'), createProduct)
  .put('/:id', authenticate, requireStaff, requirePermission('products:write'), updateProduct)
  .delete('/:id', authenticate, requireStaff, requirePermission('products:write'), deleteProduct);
