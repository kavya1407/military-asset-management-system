import express from 'express';
import { login, getCurrentUser, switchDemoUser, getDemoCredentials } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/demo-switch', switchDemoUser);
router.get('/demo-credentials', getDemoCredentials);

export default router;
