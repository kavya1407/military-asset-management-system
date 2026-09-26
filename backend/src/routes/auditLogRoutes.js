import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Accessible by Admin and Base Commander
router.get('/', requireRoles('ADMIN', 'BASE_COMMANDER'), getAuditLogs);

export default router;
