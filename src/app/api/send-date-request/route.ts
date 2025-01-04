import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
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
    const { recipientId, message, dateDetails, senderName } = await request.json();

    // Get recipient's email
    const { data: recipientData, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('email, first_name')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipientData) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Send email notification using SendGrid template
    const msg: MailDataRequired = {
      to: recipientData.email,
      from: 'dates@opheliadating.io',
      templateId: process.env.SENDGRID_DATE_REQUEST_TEMPLATE_ID!,
      dynamicTemplateData: {
        recipient_name: recipientData.first_name,
        sender_name: senderName,
        date_message: message,
        date_details: dateDetails,
        action_url: `${process.env.NEXT_PUBLIC_SITE_URL}/daterequests`,
      }
    };

    await sgMail.send(msg);

    // Save the date request to the database
    const { error: insertError } = await supabaseAdmin
      .from('date_requests')
      .insert([
        {
          recipient_id: recipientId,
          message,
          date_details: dateDetails,
          status: 'pending'
        }
      ]);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending date request:', error);
    return NextResponse.json(
      { error: 'Failed to send date request' },
      { status: 500 }
    );
  }
} 