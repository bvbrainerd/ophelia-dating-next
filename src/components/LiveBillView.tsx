import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { VenueBill, BillItem } from '@/types/venue';
import VenueIntegrationService from '@/services/VenueIntegrationService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, Receipt, Users } from 'lucide-react';

interface LiveBillViewProps {
  dateId: string;
  venueId: string;
  users: {
    id: string;
    name: string;
    avatar_url?: string;
  }[];
}

export default function LiveBillView({ dateId, venueId, users }: LiveBillViewProps) {
  const [bill, setBill] = useState<VenueBill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [processingPayment, setProcessingPayment] = useState(false);

  const venueService = VenueIntegrationService.getInstance();

  useEffect(() => {
    const fetchInitialBill = async () => {
      try {
        const { data, error } = await supabase
          .from('venue_bills')
          .select('*')
          .eq('venue_id', venueId)
          .eq('date_id', dateId)
          .single();

        if (error) throw error;
        if (data) setBill(data as VenueBill);
      } catch (err) {
        console.error('Error fetching bill:', err);
        setError('Failed to load bill');
      } finally {
        setIsLoading(false);
      }
    };

    // Subscribe to real-time bill updates
    const billSubscription = supabase
      .channel('bill-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bill_updates',
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          setBill(payload.new.bill_data as VenueBill);
        }
      )
      .subscribe();

    fetchInitialBill();

    return () => {
      billSubscription.unsubscribe();
    };
  }, [dateId, venueId]);

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const calculateSelectedTotal = (): number => {
    if (!bill) return 0;
    return bill.items
      .filter((item) => selectedItems.has(item.id))
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handlePaySelected = async () => {
    if (!bill || selectedItems.size === 0) return;

    setProcessingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const amount = calculateSelectedTotal();
      await venueService.processPayment(venueId, dateId, amount, user.id);

      // Clear selected items after successful payment
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Payment failed:', err);
      setError('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#cc0000]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No bill information available yet
      </div>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#cc0000]">Live Bill</h2>
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">
            Last updated: {new Date(bill.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {bill.items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              selectedItems.has(item.id)
                ? 'bg-red-50 border-2 border-[#cc0000]'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleItemSelect(item.id)}
          >
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-600">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">
                  Qty: {item.quantity}
                </span>
                {item.splitBetween.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    Split between {item.splitBetween.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Summary */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${bill.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>${bill.tax.toFixed(2)}</span>
        </div>
        {bill.tip !== undefined && (
          <div className="flex justify-between text-gray-600">
            <span>Tip</span>
            <span>${bill.tip.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${bill.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Actions */}
      <div className="space-y-4">
        <Button
          onClick={handlePaySelected}
          disabled={selectedItems.size === 0 || processingPayment}
          className="w-full bg-[#cc0000] text-white py-3 rounded-full font-bold disabled:opacity-50"
        >
          {processingPayment ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <DollarSign className="w-5 h-5 mr-2" />
          )}
          Pay Selected (${calculateSelectedTotal().toFixed(2)})
        </Button>

        {/* Split Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Payment Status</h3>
          <div className="space-y-2">
            {bill.splits.map((split) => {
              const user = users.find((u) => u.id === split.userId);
              return (
                <div key={split.userId} className="flex justify-between items-center">
                  <span className="text-sm">{user?.name || 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">${split.amount.toFixed(2)}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        split.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {split.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
} 