 import express from 'express';
 import dayjs from 'dayjs';
 import { Fee } from '../models/Fee.js';
 import { Student } from '../models/Student.js';
 import { authRequired, roleAllowed } from '../middleware/auth.js';

 const router = express.Router();

// List dues (admin: all; parent: own student's dues)
router.get('/', authRequired, async (req, res) => {
	try {
		const { month } = req.query; // optional filter YYYY-MM
		const filter = { status: 'unpaid' };
		if (month) filter.month = month;

		if (req.user.role === 'parent') {
			const students = await Student.find({ parent_id: req.user.id }).select('_id');
			filter.student_id = { $in: students.map((s) => s._id) };
		}

		const dues = await Fee.find(filter).populate('student_id');
		res.json(dues);
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch dues' });
	}
});

// List paid fees (admin only)
router.get('/paid', authRequired, roleAllowed('admin'), async (req, res) => {
	try {
		const { month } = req.query; // optional filter YYYY-MM
		const filter = { status: 'paid' };
		if (month) filter.month = month;

		const paid = await Fee.find(filter).populate('student_id').sort({ payment_date: -1 });
		res.json(paid);
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch paid fees' });
	}
});

 // Mark fee as paid (admin only)
 router.patch('/markPaid/:id', authRequired, roleAllowed('admin'), async (req, res) => {
 	try {
 		const { utr } = req.body || {};
 		const updated = await Fee.findByIdAndUpdate(
 			req.params.id,
 			{ status: 'paid', payment_date: new Date(), ...(utr ? { utr } : {}) },
 			{ new: true }
 		);
 		if (!updated) return res.status(404).json({ error: 'Not found' });
 		res.json(updated);
 	} catch (err) {
 		res.status(500).json({ error: 'Failed to mark as paid' });
 	}
 });

 // Helper: generate fees for current month (admin only)
 router.post('/generate-month', authRequired, roleAllowed('admin'), async (_req, res) => {
 	try {
 		const currentMonth = dayjs().format('YYYY-MM');
 		const students = await Student.find({});
 		const ops = students.map((s) => ({
 			updateOne: {
 				filter: { student_id: s._id, month: currentMonth },
 				update: { $setOnInsert: { amount: s.monthly_fee, status: 'unpaid' } },
 				upsert: true,
 			},
 		}));
 		if (ops.length) await Fee.bulkWrite(ops);
 		res.json({ ok: true, month: currentMonth });
 	} catch (err) {
 		res.status(500).json({ error: 'Failed to generate fees' });
 	}
 });

 export default router;


