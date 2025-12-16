import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Transaction endpoints
router.get('/', TransactionController.getAll);
router.get('/recent', TransactionController.getRecent);
router.get('/stats', TransactionController.getStats);
router.get('/search', TransactionController.search);
router.get('/:id', TransactionController.getById);

export default router;
