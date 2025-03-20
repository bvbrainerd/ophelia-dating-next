import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
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

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('Missing SENDGRID_API_KEY environment variable');
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, fullName, templateId } = await request.json();

    if (!email || !templateId) {
      return NextResponse.json(
        { error: 'Email and template ID are required' },
        { status: 400 }
      );
    }

    // Store referral in Supabase
    const { error: dbError } = await supabase
      .from('referrals')
      .insert({
        referred_email: email,
        referred_name: fullName,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Error storing referral:', dbError);
      throw dbError;
    }

    // Send email
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'dates@opheliadating.io',
      templateId: templateId,
      dynamicTemplateData: {
        referral_link: process.env.NEXT_PUBLIC_BASE_URL || 'https://ophelia.dating',
        full_name: fullName
      }
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
} 