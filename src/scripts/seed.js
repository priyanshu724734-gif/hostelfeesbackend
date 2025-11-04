import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Fee } from '../models/Fee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/triveni_hostels';

async function seed() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('Connected to MongoDB');

		// Clear existing data (optional)
		await User.deleteMany({});
		await Student.deleteMany({});
		await Fee.deleteMany({});
		console.log('Cleared existing data');

		// Create admin user
		const adminPassword = await bcrypt.hash('admin123', 10);
		const admin = await User.create({
			name: 'Admin User',
			role: 'admin',
			email: 'admin@trivenihostels.com',
			mobile: '9999999999',
			password: adminPassword,
		});
		console.log('Created admin user (mobile: 9999999999, password: admin123)');

		// Create parent users and students
		const parentPassword = await bcrypt.hash('parent123', 10);
		const parents = await User.create([
			{
				name: 'Rohan Singh',
				role: 'parent',
				email: 'rohan.singh@email.com',
				mobile: '9876543210',
				password: parentPassword,
			},
			{
				name: 'Priya Sharma',
				role: 'parent',
				email: 'priya.sharma@email.com',
				mobile: '9876543211',
				password: parentPassword,
			},
			{
				name: 'Amit Kumar',
				role: 'parent',
				email: 'amit.kumar@email.com',
				mobile: '9876543212',
				password: parentPassword,
			},
		]);
		console.log(`Created ${parents.length} parent users (password: parent123)`);

		// Create students
		const students = await Student.create([
			{
				name: 'Arjun Singh',
				parentName: 'Rohan Singh',
				room_no: 'A-101',
				parent_id: parents[0]._id,
				monthly_fee: 5000,
			},
			{
				name: 'Kavya Sharma',
				parentName: 'Priya Sharma',
				room_no: 'B-205',
				parent_id: parents[1]._id,
				monthly_fee: 5500,
			},
			{
				name: 'Vikram Kumar',
				parentName: 'Amit Kumar',
				room_no: 'C-310',
				parent_id: parents[2]._id,
				monthly_fee: 5000,
			},
		]);
		console.log(`Created ${students.length} students`);

		// Create sample fees for current month
		const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
		await Fee.create([
			{
				student_id: students[0]._id,
				month: currentMonth,
				amount: students[0].monthly_fee,
				status: 'unpaid',
			},
			{
				student_id: students[1]._id,
				month: currentMonth,
				amount: students[1].monthly_fee,
				status: 'unpaid',
			},
			{
				student_id: students[2]._id,
				month: currentMonth,
				amount: students[2].monthly_fee,
				status: 'unpaid',
			},
		]);
		console.log(`Created ${students.length} unpaid fees for ${currentMonth}`);

		console.log('\n✅ Seed completed successfully!');
		console.log('\nLogin credentials:');
		console.log('Admin: mobile=9999999999, password=admin123');
		console.log('Parents: mobile=9876543210/3211/3212, password=parent123');
	} catch (error) {
		console.error('Seed failed:', error);
	} finally {
		await mongoose.disconnect();
	}
}

seed();
