// app/api/date-requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

interface UpdateDateRequestBody {
  status: 'accepted' | 'declined';
  paymentCompleted?: boolean;
  paymentTime?: string;
}

// Add this new interface for the update data
interface DateRequestUpdateData {
  status: 'accepted' | 'declined';
  updated_at: string;
  payment_completed?: boolean;
  payment_completed_at?: string;
}

export async function PUT(
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

    const body: UpdateDateRequestBody = await request.json();
    
    if (!['accepted', 'declined'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Replace any with the proper type
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
      .select()
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

// GET function remains the same...