import express from 'express';
import { getExpenditures, createExpenditure } from '../controllers/expenditureController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Admin and Base Commander can track and record expenditures
router.get('/', requireRoles('ADMIN', 'BASE_COMMANDER'), getExpenditures);
router.post('/', requireRoles('ADMIN', 'BASE_COMMANDER'), createExpenditure);

export default router;
