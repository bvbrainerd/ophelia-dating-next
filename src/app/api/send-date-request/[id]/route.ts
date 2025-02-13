// app/send-request/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function GET(
  request: Request
) {
  const id = request.url.split('/').pop();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    // Get id from URL instead of params
    const id = request.url.split('/').pop();
    
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Create a new Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get user from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Verify that the sender_id matches the authenticated user
    if (body.sender_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID mismatch' },
        { status: 401 }
      );
    }

    // Create the date request
    const { error: insertError } = await supabase
      .from('date_requests')
      .insert({
        sender_id: user.id,
        receiver_id: id,
        venue: body.venue,
        proposed_time: body.proposed_time,
        proposed_payment: body.proposed_payment,
        status: 'pending'
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    // After successful date request insertion, fetch receiver's email and name
    const { data: receiverProfile, error: receiverError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', id)
      .single();

    if (receiverError || !receiverProfile) {
      console.error('Error fetching receiver profile:', receiverError);
      throw new Error('Failed to fetch receiver profile');
    }

    // Fetch sender's name for the email
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    if (senderError || !senderProfile) {
      console.error('Error fetching sender profile:', senderError);
      throw new Error('Failed to fetch sender profile');
    }

    // Send email using SendGrid template
    const msg = {
      to: receiverProfile.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'dates@opheliadating.io',
        name: 'Ophelia Dating'
      },
      templateId: process.env.SENDGRID_DATE_REQUEST_TEMPLATE_ID!,
      dynamicTemplateData: {
        recipientName: receiverProfile.first_name,
        senderName: `${senderProfile.first_name} ${senderProfile.last_name}`,
        venue: body.venue,
        dateTime: new Date(body.proposed_time).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }),
        paymentAmount: body.proposed_payment ? `$${body.proposed_payment}` : 'Pre-paid by sender',
        dashboardLink: `${process.env.NEXT_PUBLIC_BASE_URL}/daterequests`
      },
      asm: {
        groupId: 20158, // Unsubscribe group ID
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
      }
    };

    try {
      const emailResult = await sgMail.send(msg);
      console.log('Email sent successfully:', emailResult);
    } catch (emailError: any) {
      console.error('SendGrid Error:', emailError);
      if (emailError.response?.body) {
        console.error(emailError.response.body);
      }
      // Don't throw here - we still want to return success for the date request
      // but we should log the error for monitoring
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}