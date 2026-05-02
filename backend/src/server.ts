/// <reference types="node" />
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { instrumentService } from './services/instrument.service';
import { strategyEngine } from './services/engine.service';

const PORT = process.env.PORT || 5000;



app.listen(PORT, async () => {
  console.log(`🚀 StraddleTrader Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  
  // Load instruments in background
  await instrumentService.loadMaster();
});

