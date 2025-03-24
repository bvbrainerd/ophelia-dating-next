// lib/reservationUtils.ts
import { supabase } from '@/supabase/client';

export async function updateReservationStatus(
    dateRequestId: string,
    reservationDetails: { confirmationUrl: string}
) {
    const { error } = await supabase
    // TODO: ensure that this is the correct database table to update
        .from('daily_requests')
        .update({
            reservation_confirmed: true,
            reservation_details: reservationDetails
        })
        .eq('id', dateRequestId);
    if (error) {
        console.error('Error updating reservation status:', error);
        throw error;
    }     
}