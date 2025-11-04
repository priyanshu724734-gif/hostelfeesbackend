 import { google } from 'googleapis';
 import dayjs from 'dayjs';
 import { Fee } from '../models/Fee.js';
 import { Student } from '../models/Student.js';
 import { Transaction } from '../models/Transaction.js';

 function getGmailClient() {
 	const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI, GMAIL_REFRESH_TOKEN } = process.env;
 	if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REDIRECT_URI || !GMAIL_REFRESH_TOKEN) {
 		throw new Error('Gmail OAuth env not configured');
 	}
 	const oAuth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI);
 	oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
 	return google.gmail({ version: 'v1', auth: oAuth2Client });
 }

function parseEmailContent(snippet, bodyText) {
	const text = `${snippet || ''}\n${bodyText || ''}`;
	// Try multiple amount patterns (Indian formats)
	const amountMatches = [
		text.match(/₹\s*([0-9,]+(?:\.\d{2})?)/i),
		text.match(/Rs\.?\s*([0-9,]+(?:\.\d{2})?)/i),
		text.match(/INR\s*([0-9,]+(?:\.\d{2})?)/i),
		text.match(/amount[\s:]*₹?\s*([0-9,]+(?:\.\d{2})?)/i),
		text.match(/credited[\s:]*₹?\s*([0-9,]+(?:\.\d{2})?)/i),
		text.match(/received[\s:]*₹?\s*([0-9,]+(?:\.\d{2})?)/i),
	].filter(Boolean);
	const amountMatch = amountMatches[0];
	const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;

	// UTR/Transaction ID patterns (common across banks)
	const utrMatches = [
		text.match(/(?:UTR|UTR Code|Transaction ID|Txn ID|Ref No)[\s:]*([A-Za-z0-9]{10,25})/i),
		text.match(/(?:Transaction Ref)[\s:]*([A-Za-z0-9\-]{10,25})/i),
		text.match(/(?:Reference)[\s:]*([A-Z0-9]{12,25})/i),
		text.match(/(?:UPI Ref)[\s:]*([A-Z0-9]{12,25})/i),
		text.match(/UPI[A-Z0-9]{12}/),
	].filter(Boolean);
	const utrMatch = utrMatches[0];
	const utr = utrMatch ? utrMatch[1].trim() : null;

	// Payer name (optional, for logging)
	const payerMatch = text.match(/(?:from|payer|paid by|sent by)[\s:]*([A-Za-z .@_\-\d]{3,30})/i);
	const payer = payerMatch ? payerMatch[1].trim() : null;

	return { amount, utr, payer };
}

 async function getBodyText(gmail, msgId) {
 	const detail = await gmail.users.messages.get({ userId: 'me', id: msgId, format: 'full' });
 	const parts = detail?.data?.payload?.parts || [];
 	const findText = (ps) => {
 		for (const p of ps) {
 			if (p.mimeType === 'text/plain' && p.body?.data) return Buffer.from(p.body.data, 'base64').toString('utf8');
 			if (p.parts) {
 				const r = findText(p.parts);
 				if (r) return r;
 			}
 		}
 		return '';
 	};
 	return findText(parts);
 }

 export async function runGmailUpdater() {
 	const gmail = getGmailClient();
 	const q = process.env.GMAIL_QUERY || 'is:unread newer_than:7d';
 	const list = await gmail.users.messages.list({ userId: 'me', q, maxResults: 20 });
 	const messages = list.data.messages || [];

 	const results = [];
 	for (const m of messages) {
 		const meta = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
 		const snippet = meta.data.snippet || '';
 		const bodyText = await getBodyText(gmail, m.id);
 		const { amount, utr } = parseEmailContent(snippet, bodyText);
 		if (!amount || !utr) {
 			results.push({ id: m.id, status: 'skipped' });
 			continue;
 		}

 		const dateHeader = meta?.data?.payload?.headers?.find((h) => h.name === 'Date')?.value;
 		const txDate = dateHeader ? new Date(dateHeader) : new Date();
 		const month = dayjs(txDate).format('YYYY-MM');

 		// Try find matching unpaid fee by amount in current month
 		const fee = await Fee.findOne({ month, status: 'unpaid', amount }).populate('student_id');
 		if (fee) {
 			await Transaction.updateOne(
 				{ utr },
 				{ $setOnInsert: { utr, student_id: fee.student_id._id, amount, date: txDate, method: 'UPI', raw: { snippet } } },
 				{ upsert: true }
 			);
 			fee.status = 'paid';
 			fee.payment_date = txDate;
 			fee.utr = utr;
 			await fee.save();
 			results.push({ id: m.id, status: 'matched', feeId: fee._id });
 		} else {
 			results.push({ id: m.id, status: 'no_match' });
 		}

 		// Mark as read (archive to Processed label could be added here)
 		await gmail.users.messages.modify({ userId: 'me', id: m.id, requestBody: { removeLabelIds: ['UNREAD'] } });
 	}

 	return { processed: results.length, results };
 }


