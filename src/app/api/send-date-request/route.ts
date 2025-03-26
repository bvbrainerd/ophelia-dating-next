import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.ADDITIONAL_SENDGRID_API_KEY_!);

export async function POST(request: Request) {
  try {
    const { email, requestDetails } = await request.json();

    await sgMail.send({
      to: email,
      from: 'noreply@opheliadating.com',
      templateId: process.env.SENDGRID_DATE_NOTIFICATION_TEMPLATE_ID!,
      dynamicTemplateData: requestDetails
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid Error:', error);
    return NextResponse.json(
      { error: 'Failed to send date request notification' },
      { status: 500 }
    );
  }
} 