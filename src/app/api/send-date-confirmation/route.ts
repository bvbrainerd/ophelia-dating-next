import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { recipientEmail, recipientName, dateDetails, venueName, dateTime } = await request.json();

    const msg: MailDataRequired = {
      to: recipientEmail,
      from: 'dates@opheliadating.io',
      templateId: process.env.SENDGRID_DATE_CONFIRMATION_TEMPLATE_ID!,
      dynamicTemplateData: {
        recipient_name: recipientName,
        venue_name: venueName,
        date_time: new Date(dateTime).toLocaleString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        venue_details: dateDetails,
        action_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dates/upcoming`
      }
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
} 