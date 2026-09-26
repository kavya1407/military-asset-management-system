import express from 'express';
import { getBases, getEquipmentTypes, getBaseInventory } from '../controllers/baseController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getBases);
router.get('/equipment', getEquipmentTypes);
router.get('/:id/inventory', getBaseInventory);

export default router;
