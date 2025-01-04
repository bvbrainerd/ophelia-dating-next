import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const msg = {
      to: 'brainerb@bc.edu', // Test email
      from: 'dates@opheliadating.io',
      subject: 'Test Email',
      text: 'This is a test email from Ophelia',
      html: '<strong>This is a test email from Ophelia</strong>',
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid Error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
} 