import { NextResponse } from 'next/server';
import { supabase } from '@/supabase/client';

// Define interfaces to match the component's expectations
interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string;
  bio: string;
}

interface RawDateRequest {
  id: string;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'accepted' | 'declined';
  proposed_payment: number;
  profiles: Profile;
}

// Type for the raw Supabase response
interface SupabaseRawResponse {
  id: string;
  venue: string;
  proposed_time: string;
  status: 'pending' | 'accepted' | 'declined';
  proposed_payment: number;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    avatar_url: string;
    bio: string;
  };
}

interface UpdateRequestBody {
  id: string;
  status: 'accepted' | 'declined';
}

interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

const VENUE_PAYMENT_LINKS: Record<string, string> = {
  'Boston Bruins': 'https://buy.stripe.com/00gg1ng5i1BzeWY6os',
  'Celtics': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'BC Hockey': 'https://buy.stripe.com/bIYcPb3iw6VT5mobIN',
  'BC Basketball': 'https://buy.stripe.com/fZebL7bP24NL9CE9AB',
  'Boston Commons': 'https://buy.stripe.com/eVaaH31ao2FDbKM3ck',
  'Kured': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Museum of Fine Arts': 'https://buy.stripe.com/aEU8yV7yM5RP8yA3ce',
  'Private Helicopter Ride': 'https://buy.stripe.com/14k2ax7yM0xv6qs8wz',
  'Barcelona Wine Bar': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Capo': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Locco Fenway': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'F1 Arcade': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Lucca North End': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Lolita Back Bay': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Blue Ribbon Sushi': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Joes on Newbury': 'https://buy.stripe.com/3cscPb7yMa854ik5kk',
  'Snowport @Seaport': 'https://buy.stripe.com/aEUaH39GUcgd6qs009',
  'Boston Celtics Game': 'https://buy.stripe.com/5kA8yVf1e0xvg12eV0',
  'The Clay Room': 'https://buy.stripe.com/00g8yVaKYgwt4ikaEO',
};

export async function GET() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
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
      .order('created_at', { ascending: false });

    if (error) {
      const supabaseError = error as SupabaseError;
      console.error('Supabase error:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to fetch date requests' },
        { status: 500 }
      );
    }

    // First cast to unknown, then to our expected type
    const rawData = data as unknown as SupabaseRawResponse[];
    
    // Transform the data to match the expected format
    const transformedData: RawDateRequest[] = rawData.map(request => ({
      id: request.id,
      venue: request.venue,
      proposed_time: request.proposed_time,
      status: request.status,
      proposed_payment: request.proposed_payment,
      profiles: request.profiles
    }));

    return NextResponse.json({
      data: transformedData
    });

  } catch (error) {
    console.error('Error fetching date requests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch date requests';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: UpdateRequestBody = await request.json();
    
    if (!body.id || !['accepted', 'declined'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('date_requests')
      .update({
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .eq('receiver_id', user.id);

    if (error) {
      const supabaseError = error as SupabaseError;
      console.error('Supabase error:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to update date request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Date request updated successfully'
    });

  } catch (error) {
    console.error('Error updating date request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update date request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}