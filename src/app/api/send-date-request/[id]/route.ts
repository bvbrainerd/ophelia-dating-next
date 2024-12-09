// app/send-request/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}