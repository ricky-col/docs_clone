import { io } from 'socket.io-client';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret_123';
const SOCKET_URL = 'http://localhost:5001';

async function testSockets() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  const docId = '6a1af9aba4e9aecd07378eaf';

  const userA = users[0];
  const userB = users[1];

  const tokenA = jwt.sign({ id: userA._id }, ACCESS_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: userB._id }, ACCESS_SECRET, { expiresIn: '1h' });

  const clientA = io(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'], forceNew: true });
  const clientB = io(SOCKET_URL, { auth: { token: tokenB }, transports: ['websocket'], forceNew: true });

  clientA.on('connect', () => {
    console.log('Client A connected!');
    clientA.emit('document:join', { documentId: docId });
  });

  clientB.on('connect', () => {
    console.log('Client B connected!');
    clientB.emit('document:join', { documentId: docId });
  });

  clientA.on('user:joined', (data) => {
    console.log(`[A] user:joined received. Active Collaborators count:`, data.collaborators.length);
  });

  clientB.on('user:joined', (data) => {
    console.log(`[B] user:joined received. Active Collaborators count:`, data.collaborators.length);
    // B sends a text update
    const mockUpdate = Buffer.from('hello').toString('base64');
    clientB.emit('document:update', { documentId: docId, update: mockUpdate });
  });

  clientA.on('document:updated', (data) => {
    console.log(`[A] Received live text update from B:`, Buffer.from(data.update, 'base64').toString('utf8'));
    process.exit(0);
  });
}

testSockets();
