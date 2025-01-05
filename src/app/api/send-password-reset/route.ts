import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    await sgMail.send({
      to: email,
      from: 'noreply@opheliadating.com',
      templateId: process.env.SENDGRID_FORGOT_PASSWORD_TEMPLATE_ID!,
      dynamicTemplateData: {
        email,
        reset_link: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid Error:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }
} 