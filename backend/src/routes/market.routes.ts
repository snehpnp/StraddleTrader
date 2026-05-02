import { Router } from 'express';
import { getQuote, getInstruments, getExpiries, getLotSize } from '../controllers/market.controller';
import { enhancedAuthMiddleware } from '../middleware/tokenRefresh';

const router = Router();

router.use(enhancedAuthMiddleware);

router.get('/quote', getQuote);
router.get('/instruments', getInstruments);
router.get('/expiries', getExpiries);
router.get('/lot-size', getLotSize);

export default router;
