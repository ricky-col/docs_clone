import dotenv from 'dotenv';
// Load environment variables immediately before other imports
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import docRoutes from './routes/docRoutes.js';
import { socketConfig } from './sockets/socketHandler.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173', 'https://docs-clone-l1xx.onrender.com'] : ['http://localhost:5173', 'https://docs-clone-l1xx.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Bind Socket.io events
socketConfig(io);

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173', 'https://docs-clone-l1xx.onrender.com'] : ['http://localhost:5173', 'https://docs-clone-l1xx.onrender.com'],
    credentials: true,
  })
);

// Body and Cookie Parsers
app.use(express.json());
app.use(cookieParser());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
