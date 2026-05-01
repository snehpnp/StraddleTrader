import { Router } from 'express';
import {
  saveCredentials,
  getLoginUrl,
  connectBroker,
  getBrokerStatus,
  disconnectBroker,
} from '../controllers/broker.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/credentials', saveCredentials);
router.get('/login-url', getLoginUrl);
router.post('/connect', connectBroker);
router.get('/status', getBrokerStatus);
router.post('/disconnect', disconnectBroker);

export default router;
