import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth, rateLimit } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes (no auth required)
router.post('/signup', rateLimit(5, 60000), AuthController.signup);
router.post('/login', rateLimit(10, 60000), AuthController.login);

// Protected routes (auth required)
router.post('/logout', requireAuth, AuthController.logout);
router.post('/logout-all', requireAuth, AuthController.logoutAll);
router.get('/me', requireAuth, AuthController.me);
router.put('/profile', requireAuth, AuthController.updateProfile);
router.put('/password', requireAuth, AuthController.changePassword);
router.post('/verify-password', requireAuth, AuthController.verifyPassword);
router.post('/upi-pin', requireAuth, AuthController.setUpiPin);
router.post('/verify-upi-pin', requireAuth, AuthController.verifyUpiPin);
router.delete('/account', requireAuth, AuthController.deleteAccount);

export default router;
