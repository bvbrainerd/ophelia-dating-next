import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    // Get user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (getUserError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    // Send confirmation email
    await sgMail.send({
      to: email,
      from: 'noreply@opheliadating.com',
      templateId: process.env.SENDGRID_FORGOT_PASSWORD_TEMPLATE_ID!,
      dynamicTemplateData: {
        email
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming password reset:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
} 