// app/send-request/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('API: Received request for profile ID:', id);

    // Get the profile data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    console.log('API: Query result:', { data, error });

    if (error) {
      console.error('API: Database error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('API: No profile found for ID:', id);
      return NextResponse.json(
        { error: `No profile found for ID: ${id}` },
        { status: 404 }
      );
    }

    console.log('API: Successfully found profile');
    return NextResponse.json({ data });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create date request
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
      console.error('Error creating date request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create date request' },
        { status: 500 }
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