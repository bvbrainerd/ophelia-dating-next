// app/api/date-requests/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

// Reuse the interfaces from your [id]/route.ts
interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

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

export async function GET() {
  try {
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
      .eq('receiver_id', user.id)
      .order('proposed_time', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching date requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch date requests' },
      { status: 500 }
    );
  }
}