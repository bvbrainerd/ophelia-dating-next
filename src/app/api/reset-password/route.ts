import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Generate a secure reset token
    const resetToken = crypto.randomUUID();
    
    // Store the reset token in Supabase (you might need to create a password_resets table)
    const { error: dbError } = await supabase
      .from('password_resets')
      .insert([
        {
          email,
          token: resetToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        }
      ]);

    if (dbError) throw dbError;

    // Send email using SendGrid
    await sgMail.send({
      to: email,
      from: 'noreply@opheliadating.com',
      templateId: process.env.SENDGRID_FORGOT_PASSWORD_TEMPLATE_ID!,
      dynamicTemplateData: {
        resetLink: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${resetToken}`,
        email: email
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in password reset:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset' },
      { status: 500 }
    );
  }
} 