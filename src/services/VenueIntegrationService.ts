import { Venue, VenueIntegrationConfig, VenueBill, BillItem } from '@/types/venue';
import { supabase } from '@/supabase/client';

class VenueIntegrationService {
  private static instance: VenueIntegrationService;
  private integrationConfigs: Map<string, any>;
  private activePollingIntervals: Map<string, NodeJS.Timeout>;

  private constructor() {
    this.integrationConfigs = new Map();
    this.activePollingIntervals = new Map();
  }

  public static getInstance(): VenueIntegrationService {
    if (!VenueIntegrationService.instance) {
      VenueIntegrationService.instance = new VenueIntegrationService();
    }
    return VenueIntegrationService.instance;
  }

  // Initialize venue integration
  public initializeVenue(venue: any) {
    this.integrationConfigs.set(venue.id, {
      paymentSystem: venue.paymentSystem,
      reservationSystem: venue.reservationSystem,
      pricingModel: venue.pricingModel,
      realTimeFeatures: venue.realTimeFeatures
    });
  }

  // Handle reservations
  async createReservation(venue: any, dateId: string, partySize: number, dateTime: string): Promise<string> {
    // Return mock reservation ID
    return 'mock-reservation-' + Math.random().toString(36).substring(7);
  }

  // Handle real-time bill tracking
  private async startBillPolling(venueId: string): Promise<void> {
    const config = this.integrationConfigs.get(venueId);
    if (!config) return;

    const interval = setInterval(async () => {
      try {
        await this.updateBillStatus(venueId);
      } catch (error) {
        console.error('Bill polling failed:', error);
      }
    }, config.pollingInterval);

    this.activePollingIntervals.set(venueId, interval);
  }

  private async updateBillStatus(venueId: string): Promise<void> {
    const venue = await this.getVenueById(venueId);
    if (!venue) return;

    try {
      const response = await fetch(venue.paymentSystem.apiEndpoint + '/bill-status', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_VENUE_API_KEY}`,
          'Merchant-ID': venue.paymentSystem.merchantId || '',
        },
      });

      const billData = await response.json();
      
      // Update bill in Supabase
      await supabase.from('venue_bills').upsert({
        venue_id: venueId,
        bill_data: billData,
        last_updated: new Date().toISOString(),
      });

      // Emit real-time update through Supabase
      await supabase.from('bill_updates').insert({
        venue_id: venueId,
        update_type: 'bill_changed',
        bill_data: billData,
      });
    } catch (error) {
      console.error('Bill status update failed:', error);
    }
  }

  // Handle payments
  async processPayment(venueId: string, dateId: string, amount: number, userId: string): Promise<void> {
    const venue = await this.getVenueById(venueId);
    if (!venue) throw new Error('Venue not found');

    try {
      // Process payment through venue's payment system
      const paymentResponse = await fetch(venue.paymentSystem.apiEndpoint + '/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_VENUE_API_KEY}`,
          'Merchant-ID': venue.paymentSystem.merchantId || '',
        },
        body: JSON.stringify({
          dateId,
          amount,
          userId,
        }),
      });

      const paymentData = await paymentResponse.json();

      // Update payment status in Supabase
      await supabase.from('date_payments').insert({
        date_id: dateId,
        user_id: userId,
        amount,
        status: 'completed',
        payment_id: paymentData.paymentId,
        processed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  // Helper methods
  private async fetchVenueConfig(venue: Venue): Promise<VenueIntegrationConfig> {
    // Fetch venue-specific configuration from your backend
    const response = await fetch(`/api/venue-config/${venue.id}`);
    return await response.json();
  }

  private async getVenueById(venueId: string): Promise<Venue | null> {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('Error fetching venue:', error);
      return null;
    }

    return data;
  }

  // Cleanup
  public cleanup(venueId: string): void {
    const interval = this.activePollingIntervals.get(venueId);
    if (interval) {
      clearInterval(interval);
      this.activePollingIntervals.delete(venueId);
    }
    this.integrationConfigs.delete(venueId);
  }
}

export default VenueIntegrationService; 