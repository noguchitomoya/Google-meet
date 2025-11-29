import 'dotenv/config';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const requiredVars = ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_KEY', 'GOOGLE_CALENDAR_ID'] as const;

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined in .env`);
  }
});

const client = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
  subject: process.env.GOOGLE_IMPERSONATED_USER || undefined,
});

const calendar = google.calendar({ version: 'v3', auth: client });

async function main() {
  try {
    const res = await calendar.calendarList.insert({
      requestBody: { id: process.env.GOOGLE_CALENDAR_ID! },
    });
    console.log('✅ Added calendar to service account list');
    console.log('ID   :', res.data.id);
    console.log('Title:', res.data.summary);
    console.log('Time :', res.data.timeZone);
  } catch (error: any) {
    console.error('❌ Failed to add calendar');
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();

