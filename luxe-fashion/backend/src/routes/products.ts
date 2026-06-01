import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getFeatured, getNewArrivals, getBestSellers } from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/auth';
export default Router()
  .get('/', getProducts)
  .get('/featured', getFeatured)
  .get('/new-arrivals', getNewArrivals)
  .get('/best-sellers', getBestSellers)
  .get('/:slug', getProduct)
  .post('/', authenticate, requireAdmin, createProduct)
  .put('/:id', authenticate, requireAdmin, updateProduct)
  .delete('/:id', authenticate, requireAdmin, deleteProduct);
