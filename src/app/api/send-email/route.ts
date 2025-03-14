import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, templateId, dynamicTemplateData } = body;

    if (!to || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@ophelia.dating',
        name: 'Ophelia Dating'
      },
      templateId,
      dynamicTemplateData,
    };

    try {
      await sgMail.send(msg);
      return NextResponse.json({ success: true });
    } catch (sendError: any) {
      console.error('SendGrid Error:', {
        message: sendError.message,
        response: sendError.response?.body,
      });
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: sendError.message,
          response: sendError.response?.body 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 