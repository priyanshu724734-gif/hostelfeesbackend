 import express from 'express';
 import dayjs from 'dayjs';
 import { authRequired } from '../middleware/auth.js';
 import { Transaction } from '../models/Transaction.js';
 import { Fee } from '../models/Fee.js';

 const router = express.Router();

 // Parent uploads UTR or manual record by admin
 router.post('/manualUpload', authRequired, async (req, res) => {
 	try {
 		const { utr, student_id, amount, date } = req.body || {};
 		if (!utr || !student_id || !amount) {
 			return res.status(400).json({ error: 'utr, student_id, amount required' });
 		}

 		const tx = await Transaction.create({
 			utr,
 			student_id,
 			amount,
 			method: 'UPI',
 			date: date ? new Date(date) : new Date(),
 		});

 		// Attempt to match current month unpaid fee with same amount
 		const month = dayjs(tx.date).format('YYYY-MM');
 		const fee = await Fee.findOne({ student_id, month, status: 'unpaid', amount });
 		if (fee) {
 			fee.status = 'paid';
 			fee.payment_date = tx.date;
 			fee.utr = utr;
 			await fee.save();
 		}

 		res.status(201).json({ transaction: tx, matchedFeeId: fee?._id || null });
 	} catch (err) {
 		if (err.code === 11000) return res.status(400).json({ error: 'Duplicate UTR' });
 		res.status(500).json({ error: 'Failed to upload payment' });
 	}
 });

 export default router;


