import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fixIncorrectProfits } from './fixIncorrectProfits.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');

  const result = await fixIncorrectProfits();
  console.log('Result:', result);

  await mongoose.disconnect();
  process.exit(0);
};

run();