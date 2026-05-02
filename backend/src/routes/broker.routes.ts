import { Router } from 'express';
import {
  saveCredentials,
  getLoginUrl,
  connectBroker,
  getBrokerStatus,
  disconnectBroker,
} from '../controllers/broker.controller';
import { enhancedAuthMiddleware } from '../middleware/tokenRefresh';

const router = Router();

router.use(enhancedAuthMiddleware);

router.post('/credentials', saveCredentials);
router.get('/login-url', getLoginUrl);
router.post('/connect', connectBroker);
router.get('/status', getBrokerStatus);
router.post('/disconnect', disconnectBroker);

export default router;
