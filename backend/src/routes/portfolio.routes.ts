import { Router } from 'express';
import {
  getBalance,
  getPositions,
  getOrders,
  getTrades,
  getLogs,
} from '../controllers/portfolio.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/balance', getBalance);
router.get('/positions', getPositions);
router.get('/orders', getOrders);
router.get('/trades', getTrades);
router.get('/logs', getLogs);

export default router;
