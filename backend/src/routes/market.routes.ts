import { Router } from 'express';
import { getQuote, getInstruments, getExpiries } from '../controllers/market.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/quote', getQuote);
router.get('/instruments', getInstruments);
router.get('/expiries', getExpiries);

export default router;
