 import express from 'express';
 import { Student } from '../models/Student.js';
 import { User } from '../models/User.js';
 import { authRequired, roleAllowed } from '../middleware/auth.js';

 const router = express.Router();

 // List students (admin only)
 router.get('/', authRequired, roleAllowed('admin'), async (_req, res) => {
 	const students = await Student.find({}).sort({ createdAt: -1 });
 	res.json(students);
 });

 // Create student (admin only)
 router.post('/', authRequired, roleAllowed('admin'), async (req, res) => {
 	try {
 		const { name, parentName, room_no, parent_mobile, monthly_fee } = req.body || {};
 		if (!name || !parentName || !room_no || !parent_mobile || !monthly_fee) {
 			return res.status(400).json({ error: 'Missing required fields' });
 		}
 		const parent = await User.findOne({ mobile: parent_mobile, role: 'parent' });
 		if (!parent) return res.status(400).json({ error: 'Parent user not found' });
 		const created = await Student.create({ name, parentName, room_no, parent_id: parent._id, monthly_fee });
 		res.status(201).json(created);
 	} catch (err) {
 		res.status(500).json({ error: 'Failed to create student' });
 	}
 });

 // Update student (admin only)
 router.put('/:id', authRequired, roleAllowed('admin'), async (req, res) => {
 	try {
 		const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
 		if (!updated) return res.status(404).json({ error: 'Not found' });
 		res.json(updated);
 	} catch (err) {
 		res.status(500).json({ error: 'Failed to update student' });
 	}
 });

 // Delete student (admin only)
 router.delete('/:id', authRequired, roleAllowed('admin'), async (req, res) => {
 	try {
 		const deleted = await Student.findByIdAndDelete(req.params.id);
 		if (!deleted) return res.status(404).json({ error: 'Not found' });
 		res.json({ ok: true });
 	} catch (err) {
 		res.status(500).json({ error: 'Failed to delete student' });
 	}
 });

 export default router;


