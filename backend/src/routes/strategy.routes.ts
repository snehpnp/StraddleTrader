import { Router } from 'express';
import {
  createStrategy,
  getStrategies,
  getStrategy,
  updateStrategy,
  deleteStrategy,
  activateStrategy,
  deactivateStrategy,
  exitStrategy,
} from '../controllers/strategy.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getStrategies);
router.post('/', createStrategy);
router.get('/:id', getStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);
router.post('/:id/activate', activateStrategy);
router.post('/:id/deactivate', deactivateStrategy);
router.post('/:id/exit', exitStrategy);

export default router;
