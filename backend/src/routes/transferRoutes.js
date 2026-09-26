import express from 'express';
import { getTransfers, createTransfer, updateTransferStatus } from '../controllers/transferController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// All three roles can view transfers
router.get('/', getTransfers);

// Admin, Commander, Logistics Officer can initiate transfers
router.post('/', requireRoles('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), createTransfer);

// Status updates (complete/cancel)
router.patch('/:id/status', requireRoles('ADMIN', 'BASE_COMMANDER'), updateTransferStatus);

export default router;
