import { Router } from 'express';
import { BiometricController } from '../controllers/biometric.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// CRUD operations
router.get('/', BiometricController.getAll);
router.get('/:type', BiometricController.getByType);
router.post('/register', BiometricController.register);
router.post('/verify', BiometricController.verify);
router.patch('/:id/toggle', BiometricController.toggle);
router.patch('/:id/label', BiometricController.updateLabel);
router.delete('/:id', BiometricController.delete);

export default router;
