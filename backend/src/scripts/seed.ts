/**
 * Seed Script — MongoDB mein ek default user add karta hai
 * Run: npx ts-node src/scripts/seed.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/straddle_trader';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');

  const db = mongoose.connection.db!;
  const usersCol = db.collection('users');

  // Check agar already exist karta hai
  const existing = await usersCol.findOne({ email: 'admin@straddle.in' });
  if (existing) {
    console.log('⚠️  User already exists:', existing.email);
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Admin@123', salt);

  const result = await usersCol.insertOne({
    name: 'Admin User',
    email: 'admin@straddle.in',
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✅ User created successfully!');
  console.log('   ID     :', result.insertedId.toString());
  console.log('   Name   : Admin User');
  console.log('   Email  : admin@straddle.in');
  console.log('   Password: Admin@123');

  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
