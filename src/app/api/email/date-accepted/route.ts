import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { mg } from '@/lib/mailgun';

export async function POST(request: Request) {
    const { sender_id, receiver_id, venue, proposed_time, proposed_payment } = await request.json();

    try {
        const supabase = await createClient();

        const { data: senderProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', sender_id)
            .single();

        const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('id', receiver_id)
        .single();

        if (!senderProfile || !receiverProfile) {
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

        const commonContent = `
            <p><strong>Venue:</strong> ${venue}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Payment:</strong> ${proposed_payment ? `$${proposed_payment}` : 'Pre-paid by sender'}</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/daterequests">View on Dashboard</a></p>
        `;

        // Send email to receiver
        await mg.messages.create(process.env.MAILGUN_SANDBOX_DOMAIN!, {
            from: `Ophelia Dating <${process.env.MAILGUN_FROM_EMAIL}>`,
            to: [`${receiverProfile.first_name} <${receiverProfile.email}>`],
            subject: `Your Date with ${senderProfile.first_name} ${senderProfile.last_name} has been accepted!`,
            html: `
                <p>Hi ${receiverProfile.first_name},</p>
                <p>Your date request with ${senderProfile.first_name} ${senderProfile.last_name} has been accepted!</p>
                ${commonContent}
            `
        });

        // Send email to sender
        await mg.messages.create(process.env.MAILGUN_SANDBOX_DOMAIN!, {
            from: `Ophelia Dating <${process.env.MAILGUN_FROM_EMAIL}>`,
            to: [`${senderProfile.first_name} <${senderProfile.email}>`],
            subject: `Your date was accepted!`,
            html: `
                <p>Hi ${senderProfile.first_name},</p>
                <p>${receiverProfile.first_name} has accepted your date request!</p>
                ${commonContent}
            `
        });
        
        return NextResponse.json( { success: true });
    }   catch (error) {
        console.error("Email sending error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}