import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('SendGrid API key is missing');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function POST(request: Request) {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key is missing');
    return NextResponse.json(
      { error: 'Email service is not configured' },
      { status: 500 }
    );
  }

  try {
    const { email, templateId, dynamicTemplateData } = await request.json();

    if (!email || !templateId) {
      return NextResponse.json(
        { error: 'Email and template ID are required' },
        { status: 400 }
      );
    }

    console.log('Sending signup email with data:', {
      to: email,
      templateId,
      dynamicTemplateData
    });

    const msg = {
      to: {
        email: email,
        name: `${dynamicTemplateData.first_name} ${dynamicTemplateData.last_name}`
      },
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'dates@opheliadating.io',
        name: 'Ophelia Dating'
      },
      replyTo: {
        email: process.env.SENDGRID_FROM_EMAIL || 'dates@opheliadating.io',
        name: 'Ophelia Dating Support'
      },
      templateId: templateId,
      dynamicTemplateData: {
        ...dynamicTemplateData,
        email: email
      },
      asm: {
        groupId: 20158,
        groupsToDisplay: [20158]
      },
      mailSettings: {
        bypassListManagement: {
          enable: true
        },
        sandboxMode: {
          enable: false
        }
      },
      trackingSettings: {
        clickTracking: {
          enable: true
        },
        openTracking: {
          enable: true
        }
      }
    };

    const response = await sgMail.send(msg);
    console.log('SendGrid response:', response);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return NextResponse.json(
      { error: 'Failed to send signup email', details: error.message },
      { status: 500 }
    );
  }
} 