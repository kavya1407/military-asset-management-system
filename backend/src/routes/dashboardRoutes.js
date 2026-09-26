import express from 'express';
import {
  getDashboardMetrics,
  getNetMovementDetails,
  getCategoryDistribution,
  getBasesOverview
} from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/metrics', getDashboardMetrics);
router.get('/net-movement-details', getNetMovementDetails);
router.get('/distribution', getCategoryDistribution);
router.get('/bases-overview', getBasesOverview);

export default router;
