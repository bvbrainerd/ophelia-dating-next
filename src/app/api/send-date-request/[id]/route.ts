// app/send-request/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sender_id, venue, proposed_time, proposed_payment } = await request.json();

    // Insert the date request
    const { data: dateRequest, error: insertError } = await supabase
      .from('date_requests')
      .insert([{
        sender_id,
        receiver_id: params.id,
        venue,
        proposed_time,
        proposed_payment,
        status: 'pending'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Insert Error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // After successful date request insertion, fetch receiver's email and name
    const { data: receiverProfile, error: receiverError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', params.id)
      .single();

    if (receiverError || !receiverProfile) {
      console.error('Error fetching receiver profile:', receiverError);
      throw new Error('Failed to fetch receiver profile');
    }

    // Fetch sender's name for the email
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', sender_id)
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
        venue: venue,
        dateTime: new Date(proposed_time).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }),
        paymentAmount: proposed_payment ? `$${proposed_payment}` : 'Pre-paid by sender',
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

    return NextResponse.json({ success: true, data: dateRequest });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create date request' },
      { status: 500 }
    );
  }
}