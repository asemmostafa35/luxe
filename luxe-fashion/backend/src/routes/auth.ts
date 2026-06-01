import { Router } from 'express';
import { register, login, refreshToken, verifyEmail, forgotPassword, resetPassword, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
export default Router()
  .post('/register', register)
  .post('/login', login)
  .post('/refresh', refreshToken)
  .get('/verify-email/:token', verifyEmail)
  .post('/forgot-password', forgotPassword)
  .post('/reset-password', resetPassword)
  .get('/me', authenticate, getMe);
