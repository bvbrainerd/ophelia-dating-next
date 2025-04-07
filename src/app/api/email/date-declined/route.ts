import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { mg } from '@/lib/mailgun';



export async function POST(request: Request) {
    const { sender_id, receiver_id, venue, proposed_time } = await request.json();

    try {
        const supabase = await createClient();

        const { data: sender } = await supabase
            .from('profiles')
            .select('first_name, email')
            .eq('id', sender_id)
            .single();

        const { data: receiver } = await supabase
            .from('profiles')
            .select('first_name, email')
            .eq('id', receiver_id)
            .single();
        
        if (!sender || !receiver) {
            return NextResponse.json({ error: 'Profiles not found' }, { status: 404 });
        }

        const formattedTime = new Date(proposed_time).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });

        const venueDetails = `
            <p><strong>Venue:</strong> ${venue}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
        `;

         // Email to receiver (confirmation of decline)
        await mg.messages.create(process.env.MAILGUN_SANDBOX_DOMAIN!, {
            from: `Ophelia Dating <${process.env.MAILGUN_FROM_EMAIL}>`,
            to: [`${receiver.first_name} <${receiver.email}>`],
            subject: `You declined ${sender.first_name}'s date request`,
            html: `
                <p>Hi ${receiver.first_name},</p>
                <p>Thanks for responding to the request from ${sender.first_name}. We've let them know your decision.</p>
                ${venueDetails}
                <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/daterequests">Back to your dashboard</a></p>
            `,
        });

        // Email to sender (polite decline)
        await mg.messages.create(process.env.MAILGUN_SANDBOX_DOMAIN!, {
            from: `Ophelia Dating <${process.env.MAILGUN_FROM_EMAIL}>`,
            to: [`${sender.first_name} <${sender.email}>`],
            subject: `Your date request was declined`,
            html: `
              <p>Hi ${sender.first_name},</p>
              <p>Unfortunately, ${receiver.first_name} declined your date request. That’s okay — it happens!</p>
              ${venueDetails}
              <p>Keep shooting your shot – your next match might just say yes!</p>
              <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/daterequests">Try again on your dashboard</a></p>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Decline email error:', error);
        return NextResponse.json({ error: 'Failed to send decline emails' }, { status: 500 });
    }


        









}