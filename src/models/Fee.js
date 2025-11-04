 import mongoose from 'mongoose';

 const feeSchema = new mongoose.Schema(
 	{
 		student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
 		month: { type: String, required: true }, // YYYY-MM
 		amount: { type: Number, required: true, min: 0 },
 		status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid', index: true },
 		utr: { type: String, trim: true },
 		payment_date: { type: Date },
 	},
 	{ timestamps: true }
 );

 feeSchema.index({ student_id: 1, month: 1 }, { unique: true });

 export const Fee = mongoose.model('Fee', feeSchema);


