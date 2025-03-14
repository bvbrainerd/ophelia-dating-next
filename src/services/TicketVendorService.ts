import { supabase } from '@/supabase/client';

interface TicketDetails {
  id: string;
  vendorTicketId: string;
  vendorName: string;
  eventName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  seatInfo?: string;
  price: number;
  currency: string;
  ticketUrl?: string;
  qrCodeData?: string;
}

interface PurchaseTicketResponse {
  success: boolean;
  ticketDetails?: TicketDetails;
  error?: string;
}

// Base class for all ticket vendor integrations
abstract class BaseTicketVendor {
  abstract vendorName: string;
  abstract searchEvents(query: string, date?: string): Promise<any[]>;
  abstract getEventDetails(eventId: string): Promise<any>;
  abstract purchaseTickets(eventId: string, quantity: number, userId: string): Promise<PurchaseTicketResponse>;
  abstract getTicketDetails(ticketId: string): Promise<TicketDetails>;
}

// Eventbrite Integration
class EventbriteVendor extends BaseTicketVendor {
  vendorName = 'Eventbrite';
  private apiKey: string;
  private organizerId: string;

  constructor() {
    super();
    this.apiKey = process.env.EVENTBRITE_API_KEY || '';
    this.organizerId = process.env.EVENTBRITE_USER_ID || '';
  }

  async searchEvents(query: string, date?: string) {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/organizations/${this.organizerId}/events/search/?q=${query}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    return response.json();
  }

  async getEventDetails(eventId: string) {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/events/${eventId}/`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    return response.json();
  }

  async purchaseTickets(eventId: string, quantity: number, userId: string): Promise<PurchaseTicketResponse> {
    try {
      // Implementation for Eventbrite ticket purchase
      // This would involve creating an order through Eventbrite's API
      return {
        success: true,
        ticketDetails: {
          id: 'generated-id',
          vendorTicketId: 'eventbrite-ticket-id',
          vendorName: this.vendorName,
          eventName: 'Event Name',
          venueName: 'Venue Name',
          eventDate: new Date().toISOString(),
          eventTime: '19:00',
          price: 0,
          currency: 'USD'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to purchase tickets'
      };
    }
  }

  async getTicketDetails(ticketId: string): Promise<TicketDetails> {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/orders/${ticketId}/`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    const data = await response.json();
    return {
      id: ticketId,
      vendorTicketId: data.id,
      vendorName: this.vendorName,
      eventName: data.event.name,
      venueName: data.event.venue.name,
      eventDate: data.event.start.local,
      eventTime: new Date(data.event.start.local).toLocaleTimeString(),
      price: data.costs.base_price.major_value,
      currency: data.costs.base_price.currency
    };
  }
}

// Main service to handle all ticket vendor integrations
export class TicketVendorService {
  private static instance: TicketVendorService;
  private vendors: Map<string, BaseTicketVendor>;

  private constructor() {
    this.vendors = new Map();
    this.vendors.set('eventbrite', new EventbriteVendor());
    // Add more vendors here as needed
  }

  public static getInstance(): TicketVendorService {
    if (!TicketVendorService.instance) {
      TicketVendorService.instance = new TicketVendorService();
    }
    return TicketVendorService.instance;
  }

  public async purchaseTicketsForDate(
    dateId: string,
    venueId: string,
    quantity: number = 2
  ): Promise<PurchaseTicketResponse> {
    try {
      // Get venue details to determine which vendor to use
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('ticket_vendor, vendor_event_id')
        .eq('id', venueId)
        .single();

      if (venueError || !venue) {
        throw new Error('Venue not found');
      }

      const vendor = this.vendors.get(venue.ticket_vendor.toLowerCase());
      if (!vendor) {
        throw new Error('Ticket vendor not supported');
      }

      // Purchase tickets through the vendor
      const purchaseResponse = await vendor.purchaseTickets(
        venue.vendor_event_id,
        quantity,
        dateId
      );

      if (purchaseResponse.success && purchaseResponse.ticketDetails) {
        // Store ticket information in our database
        await supabase
          .from('date_tickets')
          .insert({
            date_id: dateId,
            vendor_ticket_id: purchaseResponse.ticketDetails.vendorTicketId,
            vendor_name: purchaseResponse.ticketDetails.vendorName,
            ticket_details: purchaseResponse.ticketDetails
          });
      }

      return purchaseResponse;
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      return {
        success: false,
        error: 'Failed to purchase tickets'
      };
    }
  }

  public async getTicketDetailsForDate(dateId: string): Promise<TicketDetails | null> {
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('date_tickets')
        .select('vendor_ticket_id, vendor_name, ticket_details')
        .eq('date_id', dateId)
        .maybeSingle();

      if (ticketError || !ticketData) {
        return null;
      }

      // If we have ticket details stored, return them directly
      if (ticketData.ticket_details) {
        return ticketData.ticket_details as TicketDetails;
      }

      const vendor = this.vendors.get(ticketData.vendor_name.toLowerCase());
      if (!vendor) {
        throw new Error('Ticket vendor not supported');
      }

      return await vendor.getTicketDetails(ticketData.vendor_ticket_id);
    } catch (error) {
      console.error('Error getting ticket details:', error);
      return null;
    }
  }
}

export type { TicketDetails, PurchaseTicketResponse }; 