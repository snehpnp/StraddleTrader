import mongoose, { Document, Schema } from 'mongoose';

export interface IStrategyConfig {
  underlying: string;         // NIFTY, BANKNIFTY, FINNIFTY
  expiry: string;             // 2026-05-29
  direction: 'long' | 'short';
  quantityLots: number;
  entryTime?: string;         // HH:MM format
  slPoints?: number;
  targetPoints?: number;
  maxLoss?: number;
  squareOffTime?: string;     // HH:MM auto square-off
  strikeStep?: number;        // 50 for NIFTY, 100 for BANKNIFTY
  legs?: Array<{
    type: 'CE' | 'PE';
    strike?: number;
    token?: string;
    tradingSymbol?: string;
    action: 'BUY' | 'SELL';
    lotSize?: number;
  }>;
}

export interface IStrategy extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  strategyType: 'straddle' | 'strangle' | 'iron_condor';
  isActive: boolean;
  config: IStrategyConfig;
  status: 'draft' | 'active' | 'stopped' | 'completed';
  currentPnL: number;
  entryPremium?: number;
  entryTime?: Date;
  exitTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StrategySchema = new Schema<IStrategy>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    strategyType: {
      type: String,
      enum: ['straddle', 'strangle', 'iron_condor'],
      default: 'straddle',
    },
    isActive: { type: Boolean, default: false, index: true },
    config: {
      underlying: { type: String, required: true, default: 'NIFTY' },
      expiry: { type: String, required: true },
      direction: { type: String, enum: ['long', 'short'], required: true },
      quantityLots: { type: Number, required: true, default: 1 },
      entryTime: { type: String },
      slPoints: { type: Number },
      targetPoints: { type: Number },
      maxLoss: { type: Number },
      squareOffTime: { type: String, default: '15:20' },
      strikeStep: { type: Number, default: 50 },
      legs: [
        {
          type: { type: String, enum: ['CE', 'PE'] },
          strike: Number,
          token: String,
          tradingSymbol: String,
          action: { type: String, enum: ['BUY', 'SELL'] },
          lotSize: Number,
        },
      ],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'stopped', 'completed'],
      default: 'draft',
    },
    currentPnL: { type: Number, default: 0 },
    entryPremium: { type: Number },
    entryTime: { type: Date },
    exitTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IStrategy>('Strategy', StrategySchema);
