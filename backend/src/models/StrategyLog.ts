import mongoose, { Document, Schema } from 'mongoose';

export interface IStrategyLog extends Document {
  strategyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: 'ENTRY' | 'EXIT' | 'SL_HIT' | 'TARGET_HIT' | 'MANUAL_EXIT' | 'ERROR' | 'INFO';
  message: string;
  orderIds?: string[];
  pnl?: number;
  executedAt: Date;
}

const StrategyLogSchema = new Schema<IStrategyLog>({
  strategyId: { type: Schema.Types.ObjectId, ref: 'Strategy', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, enum: ['ENTRY', 'EXIT', 'SL_HIT', 'TARGET_HIT', 'MANUAL_EXIT', 'ERROR', 'INFO'], required: true },
  message: { type: String, required: true },
  orderIds: [{ type: String }],
  pnl: { type: Number },
  executedAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.model<IStrategyLog>('StrategyLog', StrategyLogSchema);
