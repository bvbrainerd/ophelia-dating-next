// app/send-request/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Authenticated User:', user); // Debugging user data
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*, venues(*)')
      .eq('id', id)
      .single();

    console.log('Profile data:', profileData);
    
    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({ data: profileData });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: receiverId } = params;
    const { venue, proposed_time, proposed_payment } = await request.json();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return NextResponse.json(
        { error: 'Unauthorized: No valid user session' },
        { status: 401 }
      );
    }

    const dateRequest = {
      sender_id: user.id,
      receiver_id: receiverId,
      venue,
      proposed_time,
      proposed_payment,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('date_requests')
      .insert([dateRequest])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'Date request created successfully' 
    });

  } catch (error) {
    console.error('Error creating date request:', error);
    return NextResponse.json(
      { error: 'Failed to create date request' },
      { status: 500 }
    );
  }
}