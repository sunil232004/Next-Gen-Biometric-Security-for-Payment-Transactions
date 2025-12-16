import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Payment endpoints
router.get('/balance', PaymentController.getBalance);
router.post('/upi', PaymentController.processUpiPayment);
router.post('/biometric', PaymentController.processBiometricPayment);
router.post('/card', PaymentController.processCardPayment);
router.post('/add-money', PaymentController.addMoney);
router.post('/transfer', PaymentController.transfer);
router.post('/recharge', PaymentController.processRecharge);

export default router;
