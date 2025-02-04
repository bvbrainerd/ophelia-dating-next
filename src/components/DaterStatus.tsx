import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { Crown, Star, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DaterStatusProps {
  userId: string;
}

export default function DaterStatus({ userId }: DaterStatusProps) {
  const router = useRouter();
  const [daterStatus, setDaterStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({
    followThroughRate: 0,
    averageRating: 0
  });

  useEffect(() => {
    const fetchDaterStatus = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('dater_status, follow_through_rate, average_rating')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching dater status:', error);
        return;
      }

      if (data) {
        setDaterStatus(data.dater_status);
        setStats({
          followThroughRate: data.follow_through_rate || 0,
          averageRating: data.average_rating || 0
        });
      }
    };

    fetchDaterStatus();
  }, [userId]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'gold':
        return 'bg-yellow-500';
      case 'silver':
        return 'bg-gray-400';
      case 'bronze':
      default:
        return 'bg-amber-700';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'gold':
        return 'Gold';
      case 'silver':
        return 'Silver';
      case 'bronze':
      default:
        return 'Bronze';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 w-full mb-6">
      <div 
        onClick={() => router.push(`/profile/${userId}`)}
        className="bg-white border-2 border-[#BA2525] rounded-[40px] flex flex-col items-center px-6 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-[#BA2525] text-base">
          <Crown className="w-5 h-5" />
          <span>{getStatusText(daterStatus)}</span>
        </div>
        <div className="text-gray-600 text-xs whitespace-nowrap">
          Dater Status
        </div>
      </div>
      
      <div 
        onClick={() => router.push(`/profile/${userId}`)}
        className="bg-white border-2 border-[#BA2525] rounded-[40px] flex flex-col items-center px-6 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-[#BA2525] text-base">
          <Star className="w-5 h-5" />
          <span>{stats.averageRating.toFixed(1)}</span>
        </div>
        <div className="text-gray-600 text-xs whitespace-nowrap">
          Dater Rating
        </div>
      </div>
      
      <div 
        onClick={() => router.push(`/profile/${userId}`)}
        className="bg-white border-2 border-[#BA2525] rounded-[40px] flex flex-col items-center px-6 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-[#BA2525] text-base">
          <Heart className="w-5 h-5" />
          <span>{stats.followThroughRate.toFixed(0)}%</span>
        </div>
        <div className="text-gray-600 text-xs whitespace-nowrap">
          Follow-Through
        </div>
      </div>
    </div>
  );
} 