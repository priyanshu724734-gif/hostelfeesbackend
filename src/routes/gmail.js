 import express from 'express';
 import { authRequired, roleAllowed } from '../middleware/auth.js';
 import { runGmailUpdater } from '../services/gmailUpdater.js';

 const router = express.Router();

 router.get('/update', authRequired, roleAllowed('admin'), async (_req, res) => {
 	try {
 		const result = await runGmailUpdater();
 		res.json(result);
 	} catch (err) {
 		res.status(500).json({ error: err.message || 'Gmail updater failed' });
 	}
 });

 export default router;


