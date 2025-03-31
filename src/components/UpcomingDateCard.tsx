import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, Ticket } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  avatar_url: string | null;
}

interface DateRequest {
  id: string;
  venue: string | null;
  proposed_time: string | null;
  sender?: Profile;
  is_couple_date?: boolean;
  status?: string;
}

interface UpcomingDateCardProps {
  date: DateRequest;
  isPast?: boolean;
  onStartDate?: () => void;
  onRescheduleOrCancel?: () => void;
}

const UpcomingDateCard: React.FC<UpcomingDateCardProps> = ({ 
  date, 
  isPast = false,
  onStartDate,
  onRescheduleOrCancel 
}) => {
  const router = useRouter();

  const handleProfileClick = () => {
    if (date.sender?.id && !date.is_couple_date) {
      router.push(`/profile/${date.sender.id}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="p-6 bg-white rounded-lg shadow-sm mb-4">
      {/* Profile Section - Only show for single dates */}
      {!date.is_couple_date && (
        <div 
          onClick={handleProfileClick}
          className="flex items-center gap-4 mb-6 cursor-pointer"
        >
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image
              src={date.sender?.avatar_url || '/images/default-avatar.png'}
              alt={`${date.sender?.first_name}'s profile`}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold">
              {date.sender?.first_name}, {date.sender?.age}
            </h3>
          </div>
        </div>
      )}

      {/* Date Details */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-[#cc0000]" />
        <div>
          <h4 className="text-lg font-bold">
            {date.venue}
          </h4>
          <p className="text-gray-600">
            {formatDate(date.proposed_time)}
          </p>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-gray-100 h-48 rounded-lg mb-6 flex items-center justify-center">
        <span className="text-gray-500">Map loading...</span>
      </div>

      {/* Payment Status */}
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2"/>
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
        </svg>
        <span className="font-bold">Payment Status</span>
      </div>

      {/* Action Buttons */}
      {!isPast && (
        <div className="space-y-3">
          {onStartDate && (
            <button
              onClick={onStartDate}
              className="w-full p-3 bg-[#BA2525] text-white rounded-full font-bold flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              Start Date
            </button>
          )}
          {onRescheduleOrCancel && (
            <button
              onClick={onRescheduleOrCancel}
              className="w-full p-3 border-2 border-[#BA2525] text-[#BA2525] rounded-full font-bold"
            >
              Reschedule/Cancel
            </button>
          )}
        </div>
      )}

      {/* View Details Button for Past Dates */}
      {isPast && (
        <button
          onClick={() => router.push(`/dates/upcoming/${date.id}`)}
          className="w-full p-3 bg-[#BA2525] text-white rounded-full font-bold flex items-center justify-center gap-2"
        >
          <Ticket className="w-5 h-5" />
          View Details
        </button>
      )}
    </Card>
  );
};

export default UpcomingDateCard; 