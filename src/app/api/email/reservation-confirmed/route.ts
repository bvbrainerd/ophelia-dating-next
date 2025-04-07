import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { mg } from '@/lib/mailgun';

export async function POST(request: Request) {
    const { date_request_id, reservation_url } = await request.json();

    try {
        const supabase = await createClient();

        // Fetch the date request and related profiles
        const { data: dateRequest } = await supabase
            .from('date_requests')
            .select('sender_id, receiver_id, venue, proposed_time, proposed_payment')
            .eq('id', date_request_id)
            .single();

        if (!dateRequest) {
            return NextResponse.json({ error: 'Date request not found' }, { status: 404 });
        }

        const [senderRes, receiverRes] = await Promise.all([
            supabase.from('profiles').select('first_name, email').eq('id', dateRequest.sender_id).single(),
            supabase.from('profiles').select('first_name, email').eq('id', dateRequest.receiver_id).single(),
        ]);

        const sender = senderRes.data;
        const receiver = receiverRes.data;

        const formattedTime = new Date(dateRequest.proposed_time).toLocaleString('en-US', {
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
            <p>Your date with ${otherPerson} has been confirmed with a reservation!</p>
            <p><strong>Venue:</strong> ${dateRequest.venue}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Payment:</strong> ${dateRequest.proposed_payment ? `$${dateRequest.proposed_payment}` : 'Pre-paid by sender'}</p>
            <p><a href="${reservation_url}" target="_blank">View Reservation</a></p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/daterequests">See Details on Dashboard</a></p>
        `;

        await Promise.all([
            mg.messages.create(process.env.MAILGUN_SANDBOX_DOMAIN!, {
                from: `Ophelia Dating <${process.env.MAILGUN_FROM_EMAIL}>`,
                to: [`${sender?.first_name} <${sender?.email}>`],
                subject: `Your Reservation is confirmed!`,
                html: emailHTML(sender?.first_name, receiver?.first_name),
            }),
            mg.messages.create(process.env.MAILGUN_SANDBOX_DOMAIN!, {
                from: `Ophelia Dating <${process.env.MAILGUN_FROM_EMAIL}>`,
                to: [`${receiver?.first_name} <${receiver?.email}>`],
                subject: `Your Reservation is confirmed!`,
                html: emailHTML(receiver?.first_name, sender?.first_name),
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reservation email error:', error);
        return NextResponse.json({ error: 'Failed to send confirmation emails'}, { status: 500 });
    }
}