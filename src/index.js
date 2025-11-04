import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import feeRoutes from './routes/fees.js';
import paymentRoutes from './routes/payment.js';
import gmailRoutes from './routes/gmail.js';
import { runGmailUpdater } from './services/gmailUpdater.js';

dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// ✅ Allow CORS from both localhost and Vercel frontend
const allowedOrigins = [
  'http://localhost:5173', // local dev
  'https://your-frontend-name.vercel.app', // replace with actual Vercel URL after first deploy
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ✅ Basic health route
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'triveni-hostels-backend' });
});

// ✅ Root route (for Render test)
app.get('/', (req, res) => {
  res.send('✅ Triveni Hostels Backend is running successfully on Render!');
});

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/gmail', gmailRoutes);

const PORT = process.env.PORT || 8000;

async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set');

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API listening on http://localhost:${PORT}`);
    });

    // ✅ Cron job setup (auto Gmail updater)
    const schedule = process.env.CRON_SCHEDULE || '*/10 * * * *';
    cron.schedule(schedule, async () => {
      try {
        await runGmailUpdater();
        console.log('📩 Gmail updater ran');
      } catch (e) {
        console.error('Gmail updater error:', e.message);
      }
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();


