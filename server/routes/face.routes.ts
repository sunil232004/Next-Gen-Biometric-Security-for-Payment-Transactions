import { Router } from 'express';
import { FaceController } from '../controllers/face.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Face recognition endpoints
router.post('/register', FaceController.register);
router.post('/verify', FaceController.verify);
router.get('/status', FaceController.status);

export default router;
