 import mongoose from 'mongoose';

 const userSchema = new mongoose.Schema(
 	{
 		name: { type: String, required: true, trim: true },
 		role: { type: String, enum: ['admin', 'parent'], required: true },
 		email: { type: String, trim: true, lowercase: true },
 		mobile: { type: String, required: true, unique: true, index: true },
 		password: { type: String, required: true }, // hashed
 	},
 	{ timestamps: true }
 );

 userSchema.index({ role: 1 });

 export const User = mongoose.model('User', userSchema);


