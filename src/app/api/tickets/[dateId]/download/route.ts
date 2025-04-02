import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { cookies } from 'next/headers';
import { AppleWalletService } from '@/services/AppleWalletService';
import { TicketVendorService } from '@/services/TicketVendorService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { dateId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: date } = await supabase
      .from('dates')
      .select(`
        *,
        venues (*),
        profiles!dates_other_person_id_fkey (
          first_name,
          age,
          avatar_url
        )
      `)
      .eq('id', params.dateId)
      .single();

    if (!date) {
      return new NextResponse('Date not found', { status: 404 });
    }

    // Get ticket details from vendor if available
    const ticketService = TicketVendorService.getInstance();
    const ticketDetails = await ticketService.getTicketDetailsForDate(params.dateId);

    // Generate Apple Wallet pass
    const walletService = AppleWalletService.getInstance();
    const pass = await walletService.generatePass({
      id: params.dateId,
      venue: ticketDetails?.venueName || date.venues.name,
      proposedTime: ticketDetails?.eventDate || date.proposed_time,
      otherPerson: {
        firstName: date.profiles.first_name,
        age: date.profiles.age
      }
    });

    return new NextResponse(pass, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="ophelia-date-${params.dateId}.pkpass"`
      }
    });
  } catch (error) {
    console.error('Error generating pass:', error);
    return new NextResponse('Error generating pass', { status: 500 });
  }
} 