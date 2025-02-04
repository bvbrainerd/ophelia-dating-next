import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { email, dateDetails } = await request.json();

    // Send date confirmation email with new template
    await sgMail.send({
      to: email,
      from: 'noreply@opheliadating.com',
      templateId: 'f0924ed2cae7404fa18a063a4f092b0c',
      dynamicTemplateData: dateDetails
    });

    // Send date reminder email
    await sgMail.send({
      to: email,
      from: 'noreply@opheliadating.com',
      templateId: process.env.SENDGRID_DATE_REMINDER_TEMPLATE_ID!,
      dynamicTemplateData: dateDetails
    });

    const dateTime = new Date(dateDetails.date_time);
    const now = new Date();

    // Calculate timing for pre and post date emails
    const checkInTime = new Date(dateTime.getTime() - (24 * 60 * 60 * 1000));
    const postDateTime = new Date(dateTime.getTime() + (12 * 60 * 60 * 1000));
    
    // Schedule pre-date check-in email if date is more than 24 hours away
    if (checkInTime > now) {
      await sgMail.send({
        to: email,
        from: 'noreply@opheliadating.com',
        templateId: process.env.SENDGRID_PRE_DATE_CHECK_IN_TEMPLATE_ID!,
        dynamicTemplateData: {
          ...dateDetails,
          sendAt: checkInTime.toISOString()
        }
      });
    }

    // Schedule post-date check-in email
    await sgMail.send({
      to: email,
      from: 'noreply@opheliadating.com',
      templateId: process.env.SENDGRID_POST_DATE_CHECK_IN_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...dateDetails,
        sendAt: postDateTime.toISOString()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid Error:', error);
    return NextResponse.json(
      { error: 'Failed to send date confirmation email' },
      { status: 500 }
    );
  }
} 