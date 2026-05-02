import mongoose, { Document, Schema } from 'mongoose';

export interface IBrokerConnection extends Document {
  userId: mongoose.Types.ObjectId;
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  accessTokenEncrypted: string;
  feedTokenEncrypted?: string;  // For WebSocket streaming
  brokerUserId?: string;
  brokerName?: string;
  status: 'connected' | 'disconnected' | 'error';
  tokenExpiry?: Date;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BrokerConnectionSchema = new Schema<IBrokerConnection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    apiKeyEncrypted: { type: String, required: true },
    apiSecretEncrypted: { type: String, required: true },
    accessTokenEncrypted: { type: String, default: '' },
    feedTokenEncrypted: { type: String },  // For WebSocket streaming
    brokerUserId: { type: String },
    brokerName: { type: String, default: 'Stoxkart' },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'disconnected',
    },
    tokenExpiry: { type: Date },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IBrokerConnection>('BrokerConnection', BrokerConnectionSchema);
