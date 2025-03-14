import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import ProfileImage from './ProfileImage';

interface ShameBoardEntry {
  id: string;
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    dating_status: string;
    rating: number;
  };
  cancellation_count: number;
  week_start: string;
}

export default function ShameBoard() {
  const [shameBoardEntries, setShameBoardEntries] = useState<ShameBoardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShameBoardEntries = async () => {
      try {
        // Get the start of the current week
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('shame_board')
          .select(`
            id,
            cancellation_count,
            week_start,
            user:profiles (
              id,
              first_name,
              avatar_url,
              dating_status,
              rating
            )
          `)
          .gte('week_start', startOfWeek.toISOString())
          .order('cancellation_count', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Transform the data to match our interface
        const typedEntries = (data || []).map((entry: any) => ({
          id: entry.id,
          cancellation_count: entry.cancellation_count,
          week_start: entry.week_start,
          user: {
            id: entry.user.id,
            first_name: entry.user.first_name,
            avatar_url: entry.user.avatar_url,
            dating_status: entry.user.dating_status,
            rating: entry.user.rating
          }
        }));

        setShameBoardEntries(typedEntries);
      } catch (error) {
        console.error('Error fetching shame board:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShameBoardEntries();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  if (shameBoardEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-[#cc0000] mb-6">
          Biggest Bailers This Week 😬
        </h2>
        <div className="text-center py-8 text-gray-500">
          No cancellations this week! 🎉
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-[#cc0000] mb-6">
        Biggest Bailers This Week 😬
      </h2>

      <div className="space-y-4">
        {shameBoardEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <ProfileImage user={entry.user} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {entry.user.first_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    entry.user.dating_status === 'gold' ? 'bg-yellow-400' :
                    entry.user.dating_status === 'silver' ? 'bg-gray-400' :
                    entry.user.dating_status === 'bronze' ? 'bg-orange-600' :
                    'bg-red-600'
                  }`} />
                  <span className="capitalize">{entry.user.dating_status} Status</span>
                  <span>•</span>
                  <span>{entry.user.rating.toFixed(1)} ★</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#cc0000]">
                {entry.cancellation_count}
              </div>
              <div className="text-sm text-gray-500">
                {entry.cancellation_count === 1 ? 'Cancellation' : 'Cancellations'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 