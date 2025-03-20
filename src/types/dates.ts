export interface DateRequest {
  id: string;
  venue: {
    id: string;
    name: string;
  };
  scheduled_time: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  } | null;
  reservation: {
    id: string;
    status: string;
    date_time: string;
  } | null;
  bill: {
    id: string;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    status: string;
    bill_data: any;
  } | null;
}

export interface RawDateResponse {
  id: string;
  venue_id: string;
  scheduled_time: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  venues: {
    id: string;
    name: string;
  } | null;
  date_reservations: Array<{
    id: string;
    status: string;
    date_time: string;
  }> | null;
  venue_bills: Array<{
    id: string;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    status: string;
    bill_data: any;
  }> | null;
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    age: number;
  } | null;
} 