// app/api/date-requests/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/supabase/client';

interface UpdateDateRequestBody {
  status: 'accepted' | 'declined';
  paymentCompleted?: boolean;
  paymentTime?: string;
}

// Define the update data interface
interface DateRequestUpdateData {
  status: 'accepted' | 'declined';
  updated_at: string;
  payment_completed?: boolean;
  payment_completed_at?: string;
}

// Define the profile interface
interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

// Define the date request interface
interface DateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: 'accepted' | 'declined' | 'pending';
  proposed_payment: number;
  payment_completed: boolean;
  payment_completed_at?: string;
  profiles?: Profile;
}

export async function PUT(
  request: Request
) {
  try {
    const id = request.url.split('/').pop();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: UpdateDateRequestBody = await request.json();
    
    if (!['accepted', 'declined'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Now using the proper type instead of any
    const updateData: DateRequestUpdateData = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (body.paymentCompleted) {
      updateData.payment_completed = true;
      updateData.payment_completed_at = body.paymentTime || new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('date_requests')
      .update(updateData)
      .eq('id', id)
      .eq('receiver_id', user.id)
      .select(`
        *,
        profiles!date_requests_sender_id_fkey (
          id,
          first_name,
          last_name,
          age,
          avatar_url,
          bio
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update date request' },
        { status: 500 }
      );
    }

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

export async function GET(
  request: Request
) {
  try {
    const id = request.url.split('/').pop();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('date_requests')
      .select(`
        *,
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
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .single();

    if (error) {
      console.error('Error fetching date request:', error);
      return NextResponse.json(
        { error: 'Failed to fetch date request' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Date request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}