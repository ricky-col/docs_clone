import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const docs = await db.collection('documents').find({ inviteToken: { $exists: false } }).toArray();
  for (const doc of docs) {
    await db.collection('documents').updateOne(
      { _id: doc._id },
      { $set: { inviteToken: crypto.randomUUID() } }
    );
  }
  console.log(`Tokens added to ${docs.length} existing documents`);
  process.exit(0);
});
