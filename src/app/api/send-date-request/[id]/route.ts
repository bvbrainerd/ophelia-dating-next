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

    const { error: insertError } = await supabase
      .from('date_requests')
      .insert({
        sender_id: user.id,
        receiver_id: id,  // Using id from URL
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

    // Send email notification
    const msg = {
      to: receiverProfile.email,
      from: 'noreply@opheliadating.com', // Replace with your verified SendGrid sender
      subject: 'New Date Request on Ophelia Dating!',
      text: `${senderProfile.first_name} has sent you a date request!`,
      html: `
        <div style="background-color: #f9f9f9; padding: 20px;">
          <h1 style="color: #cc0000;">New Date Request!</h1>
          <p>Hi ${receiverProfile.first_name},</p>
          <p>${senderProfile.first_name} ${senderProfile.last_name} has sent you a date request!</p>
          <p>Venue: ${body.venue}</p>
          <p>Proposed Time: ${new Date(body.proposed_time).toLocaleString()}</p>
          ${body.proposed_payment ? `<p>Proposed Payment: $${body.proposed_payment}</p>` : ''}
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/matching" 
             style="background-color: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
            View Request
          </a>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Email notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't throw here - we still want to return success even if email fails
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