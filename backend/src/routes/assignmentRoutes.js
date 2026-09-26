import express from 'express';
import { getAssignments, createAssignment, returnAssignment } from '../controllers/assignmentController.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Admin and Base Commander have access to assignments; Logistics Officer is restricted per RBAC spec
router.get('/', requireRoles('ADMIN', 'BASE_COMMANDER'), getAssignments);
router.post('/', requireRoles('ADMIN', 'BASE_COMMANDER'), createAssignment);
router.patch('/:id/return', requireRoles('ADMIN', 'BASE_COMMANDER'), returnAssignment);

export default router;
