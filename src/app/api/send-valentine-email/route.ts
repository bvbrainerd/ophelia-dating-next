import { NextResponse } from 'next/server';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'dates@opheliadating.io';

export async function POST(request: Request) {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key is missing');
    return NextResponse.json(
      { error: 'SendGrid API key is missing' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { to, templateId, dynamicTemplateData } = body;

    if (!to || !templateId || !dynamicTemplateData) {
      console.error('Missing required fields:', { to, templateId, dynamicTemplateData });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Sending email with data:', {
      to,
      templateId,
      dynamicTemplateData,
      fromEmail: SENDGRID_FROM_EMAIL
    });

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          dynamic_template_data: dynamicTemplateData,
        }],
        from: { 
          email: SENDGRID_FROM_EMAIL,
          name: 'Ophelia Dating'
        },
        template_id: templateId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`SendGrid API error: ${errorText}`);
    }

    console.log('Email sent successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 