import express from 'express';
import { getPurchases, createPurchase } from '../controllers/purchaseController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// All three roles (Admin, Commander, Logistics Officer) can view and record purchases
router.get('/', getPurchases);
router.post('/', requireRoles('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), createPurchase);

export default router;
