 import mongoose from 'mongoose';

 const transactionSchema = new mongoose.Schema(
 	{
 		utr: { type: String, required: true, unique: true, index: true },
 		student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
 		method: { type: String, default: 'UPI' },
 		amount: { type: Number, required: true, min: 0 },
 		date: { type: Date, required: true },
 		raw: { type: Object },
 	},
 	{ timestamps: true }
 );

 export const Transaction = mongoose.model('Transaction', transactionSchema);


