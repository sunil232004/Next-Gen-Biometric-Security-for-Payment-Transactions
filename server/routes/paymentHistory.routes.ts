import { Router } from 'express';
import { PaymentHistoryController } from '../controllers/paymentHistory.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/payment-history - Get all payment history with pagination and filters
router.get('/', PaymentHistoryController.getAll);

// GET /api/payment-history/recent - Get recent payments
router.get('/recent', PaymentHistoryController.getRecent);

// GET /api/payment-history/statistics - Get payment statistics
router.get('/statistics', PaymentHistoryController.getStatistics);

// GET /api/payment-history/search - Search payments
router.get('/search', PaymentHistoryController.search);

// GET /api/payment-history/monthly-summary - Get monthly summary
router.get('/monthly-summary', PaymentHistoryController.getMonthlySummary);

// GET /api/payment-history/transaction/:transactionId - Get by transaction ID
router.get('/transaction/:transactionId', PaymentHistoryController.getByTransactionId);

// GET /api/payment-history/:id - Get single payment by ID
router.get('/:id', PaymentHistoryController.getById);

// POST /api/payment-history - Create new payment record
router.post('/', PaymentHistoryController.create);

// PATCH /api/payment-history/:id/status - Update payment status
router.patch('/:id/status', PaymentHistoryController.updateStatus);

export default router;
