 import jwt from 'jsonwebtoken';

 export function authRequired(req, res, next) {
 	try {
 		const authHeader = req.headers.authorization || '';
 		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
 		if (!token) return res.status(401).json({ error: 'Unauthorized' });
 		const secret = process.env.JWT_SECRET;
 		if (!secret) return res.status(500).json({ error: 'JWT secret not configured' });
 		const payload = jwt.verify(token, secret);
 		req.user = payload;
 		next();
 	} catch (err) {
 		return res.status(401).json({ error: 'Invalid token' });
 	}
 }

 export function roleAllowed(...roles) {
 	return (req, res, next) => {
 		if (!req.user || !roles.includes(req.user.role)) {
 			return res.status(403).json({ error: 'Forbidden' });
 		}
 		next();
 	};
 }


