 import mongoose from 'mongoose';

 const studentSchema = new mongoose.Schema(
 	{
 		name: { type: String, required: true, trim: true },
 		parentName: { type: String, required: true, trim: true },
 		room_no: { type: String, required: true, trim: true },
 		parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 		monthly_fee: { type: Number, required: true, min: 0 },
 	},
 	{ timestamps: true }
 );

 studentSchema.index({ room_no: 1 });
 studentSchema.index({ parent_id: 1 });

 export const Student = mongoose.model('Student', studentSchema);


