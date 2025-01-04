import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';
import { MailDataRequired } from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    // Generate reset password link using Supabase
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      },
    });

    if (resetError) {
      console.error('Reset link generation error:', resetError);
      return NextResponse.json(
        { error: 'Failed to generate reset link' }, 
        { status: 500 }
      );
    }

    const resetLink = data.properties?.action_link;
    
    if (!resetLink) {
      return NextResponse.json(
        { error: 'No reset link generated' }, 
        { status: 500 }
      );
    }

    // Send email using SendGrid template
    const msg: MailDataRequired = {
      to: email,
      from: 'dates@opheliadating.io',
      templateId: process.env.SENDGRID_RESET_PASSWORD_TEMPLATE_ID!,
      dynamicTemplateData: {
        reset_link: resetLink,
        user_email: email
      }
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to send reset password email' }, 
      { status: 500 }
    );
  }
} 