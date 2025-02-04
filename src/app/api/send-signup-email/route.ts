import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { email, templateId, dynamicTemplateData } = await request.json();

    if (!email || !templateId) {
      return NextResponse.json(
        { error: 'Email and template ID are required' },
        { status: 400 }
      );
    }

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
        groupId: 20158, // Your unsubscribe group ID
        groupsToDisplay: [20158]
      },
      mailSettings: {
        bypassListManagement: {
          enable: true // This is a transactional email
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
      },
      ipPoolName: "transactional_emails" // Use a dedicated IP pool if available
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid Error:', error);
    return NextResponse.json(
      { error: 'Failed to send signup email' },
      { status: 500 }
    );
  }
} 