export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

// Interfaces
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

export async function GET(req: Request) {
  try {
    // Extract the token from the request header
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      console.error('Missing token in request');
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    // Authenticate the user using the token
    const { data: userResponse, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userResponse.user) {
      console.error('Authentication failed:', userError);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const user = userResponse.user;

    console.log(`Fetching pending date requests for user: ${user.id}`);

    // Query to fetch pending date requests for the authenticated user
    const { data: dateRequests, error: queryError } = await supabase
      .from('date_requests')
      .select(`
        id,
        venue,
        proposed_time,
        status,
        proposed_payment,
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
      .eq('status', 'pending')
      .order('proposed_time', { ascending: false });

    if (queryError) {
      console.error('Database query failed:', queryError.message);
      return NextResponse.json(
        { error: 'Failed to fetch date requests' },
        { status: 500 }
      );
    }

    if (!dateRequests || dateRequests.length === 0) {
      console.warn(`No pending date requests found for user: ${user.id}`);
      return NextResponse.json({ data: [], message: 'No pending date requests found' });
    }

    console.log(`Fetched ${dateRequests.length} pending date requests for user: ${user.id}`);
    return NextResponse.json({ data: dateRequests });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error('Unexpected error:', errorMessage, (error as Error).stack);
    return NextResponse.json(
      { error: 'Failed to fetch date requests due to a server error' },
      { status: 500 }
    );
  }
}
