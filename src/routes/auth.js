 import express from 'express';
 import bcrypt from 'bcryptjs';
 import jwt from 'jsonwebtoken';
 import { User } from '../models/User.js';

 const router = express.Router();

 router.post('/login', async (req, res) => {
 	try {
 		const { mobile, password } = req.body || {};
 		if (!mobile || !password) return res.status(400).json({ error: 'Mobile and password required' });

 		const user = await User.findOne({ mobile });
 		if (!user) return res.status(401).json({ error: 'Invalid credentials' });

 		const ok = await bcrypt.compare(password, user.password);
 		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

 		const secret = process.env.JWT_SECRET;
 		if (!secret) return res.status(500).json({ error: 'JWT secret not configured' });

 		const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, secret, { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
 	} catch (err) {
 		return res.status(500).json({ error: 'Login failed' });
 	}
 });

 export default router;


