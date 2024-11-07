// app/api/date-requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

interface UpdateDateRequestBody {
  status: 'accepted' | 'declined';
  paymentCompleted?: boolean;
  paymentTime?: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: UpdateDateRequestBody = await request.json();
    
    if (!['accepted', 'declined'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    // Add payment details if provided
    if (body.paymentCompleted) {
      updateData.payment_completed = true;
      updateData.payment_completed_at = body.paymentTime || new Date().toISOString();
    }

    // Update the date request
    const { data, error } = await supabase
      .from('date_requests')
      .update(updateData)
      .eq('id', id)
      .eq('receiver_id', user.id) // Security: ensure the user owns this request
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update date request' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data,
      message: 'Date request updated successfully'
    });

  } catch (error) {
    console.error('Error updating date request:', error);
    return NextResponse.json(
      { error: 'Failed to update date request' },
      { status: 500 }
    );
  }
}

// Optionally add GET method if you need to fetch individual date requests
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('date_requests')
      .select(`
        id,
        venue,
        proposed_time,
        status,
        proposed_payment,
        payment_completed,
        payment_completed_at,
        profiles!date_requests_sender_id_fkey (
          id,
          first_name,
          last_name,
          age,
          avatar_url,
          bio
        )
      `)
      .eq('id', id)
      .eq('receiver_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching date request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch date request' },
      { status: 500 }
    );
  }
}