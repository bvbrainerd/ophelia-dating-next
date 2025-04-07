import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { mg } from '@/lib/mailgun';

export async function POST(request: Request) {
  const { date_request_id } = await request.json();

  try {
    const supabase = await createClient();

    const { data: request } = await supabase
      .from('date_requests')
      .select('sender_id, receiver_id, venue, proposed_time, proposed_payment')
      .eq('id', date_request_id)
      .single();

    if (!request) {
      return NextResponse.json({ error: 'Date request not found' }, { status: 404 });
    }

    const [senderRes, receiverRes] = await Promise.all([
      supabase.from('profiles').select('first_name, email').eq('id', request.sender_id).single(),
      supabase.from('profiles').select('first_name, email').eq('id', request.receiver_id).single(),
    ]);

    const sender = senderRes.data;
    const receiver = receiverRes.data;

    const formattedTime = new Date(request.proposed_time).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });

    const emailHTML = (name: string, otherPerson: string) => `
      <p>Hi ${name},</p>
      <p>Your date with ${otherPerson} was accepted, but we ran into an issue while trying to book the reservation.</p>
      <p><strong>Venue:</strong> ${request.venue}</p>
      <p><strong>Time:</strong> ${formattedTime}</p>
      <p><strong>Payment:</strong> ${request.proposed_payment ? `$${request.proposed_payment}` : 'Pre-paid by sender'}</p>
      <p>Don't worry – we're on it and will follow up shortly. You can view your date here:</p>
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/daterequests">Check Dashboard</a></p>
    `;

    await Promise.all([
      mg.messages.create(process.env.MAILGUN_SANDBOX_DOMAIN!, {
        from: `Ophelia Dating <${process.env.MAILGUN_FROM_EMAIL}>`,
        to: [`${sender?.first_name} <${sender?.email}>`],
        subject: `Reservation issue – we're on it`,
        html: emailHTML(sender?.first_name, receiver?.first_name),
      }),
      mg.messages.create(process.env.MAILGUN_SANDBOX_DOMAIN!, {
        from: `Ophelia Dating <${process.env.MAILGUN_FROM_EMAIL}>`,
        to: [`${receiver?.first_name} <${receiver?.email}>`],
        subject: `Reservation issue – we're on it`,
        html: emailHTML(receiver?.first_name, sender?.first_name),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Booking failed email error:', error);
    return NextResponse.json({ error: 'Failed to send booking issue emails' }, { status: 500 });
  }
}

