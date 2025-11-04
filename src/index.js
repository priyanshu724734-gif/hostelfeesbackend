 import express from 'express';
 import cors from 'cors';
 import morgan from 'morgan';
 import cookieParser from 'cookie-parser';
 import dotenv from 'dotenv';
 import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import feeRoutes from './routes/fees.js';
import paymentRoutes from './routes/payment.js';
import gmailRoutes from './routes/gmail.js';
import cron from 'node-cron';
import { runGmailUpdater } from './services/gmailUpdater.js';

 dotenv.config();

 const app = express();

 // Middleware
 app.use(express.json({ limit: '1mb' }));
 app.use(cookieParser());
 app.use(morgan('dev'));
 app.use(
 	cors({
 		origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
 		credentials: true,
 	})
 );

 // Basic health
 app.get('/api/health', (_req, res) => {
 	res.json({ ok: true, service: 'triveni-hostels-backend' });
 });

 // Routes (wired below after models/middleware exist)
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
 		// eslint-disable-next-line no-console
 		console.log('Connected to MongoDB');

 		app.listen(PORT, () => {
 			// eslint-disable-next-line no-console
 			console.log(`API listening on http://localhost:${PORT}`);
 		});

		// Cron
		const schedule = process.env.CRON_SCHEDULE || '*/10 * * * *';
		cron.schedule(schedule, async () => {
			try {
				await runGmailUpdater();
				// eslint-disable-next-line no-console
				console.log('Gmail updater ran');
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error('Gmail updater error:', e.message);
			}
		});
 	} catch (err) {
 		// eslint-disable-next-line no-console
 		console.error('Failed to start server:', err.message);
 		process.exit(1);
 	}
 }

 start();


