import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

export async function POST(req: Request) {
  try {
    const { user_challenge_id } = await req.json();

    // Get the challenge details
    const { data: challenge } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', user_challenge_id)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if enough time has passed since last notification (at least 30 minutes)
    const lastNotification = new Date(challenge.last_notification_time || 0);
    const now = new Date();
    const timeDiff = now.getTime() - lastNotification.getTime();
    const minDiff = timeDiff / (1000 * 60);

    if (minDiff < 30) {
      return NextResponse.json({ message: 'Too soon for another notification' }, { status: 200 });
    }

    // Update last notification time
    const { error: updateError } = await supabase
      .from('user_challenges')
      .update({ last_notification_time: now.toISOString() })
      .eq('id', user_challenge_id);

    if (updateError) {
      throw updateError;
    }

    // Return success with notification data
    return NextResponse.json({
      message: 'Time to capture a moment from your date!',
      type: 'date_reminder',
      challenge_id: user_challenge_id
    });

  } catch (error) {
    console.error('Error processing notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 