// Daily dare generation and management
import { supabase } from '@/supabase/client';

// Dares for singles
const singlesDares = [
  "Post a video confessing your biggest dating fear",
  "Go live and share your most embarrassing date story",
  "Post a public apology for being a date bailer",
  "Share a video explaining why you keep running from real connections",
  "Record yourself doing a silly dance in a public place",
  "Post a video singing a love song dedicated to your future date"
];

// Dares for couples
const couplesDares = [
  "Kiss your date by the end of the night",
  "Ask your date to dance in public",
  "Share your deepest fear with your date",
  "Tell your date something you've never told anyone else",
  "Propose a spontaneous adventure during the date",
  "Give your date a thoughtful compliment every 30 minutes"
];

// Get a deterministic random number based on date
const getDateSeed = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
};

// Get a random item from array using seed
const getRandomItemWithSeed = (array: string[], seed: number): string => {
  const index = seed % array.length;
  return array[index];
};

interface DailyDare {
  dare: string;
  date: string;
  type: 'single' | 'couple';
}

// Format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDailyDare = async (userStatus: 'single' | 'couple'): Promise<DailyDare> => {
  const today = new Date();
  const dateString = formatDate(today);
  const dateSeed = getDateSeed(today);
  const dareArray = userStatus === 'single' ? singlesDares : couplesDares;
  
  try {
    // First try to get existing dare
    const { data: existingDare, error: fetchError } = await supabase
      .from('daily_dares')
      .select('*')
      .eq('date', dateString)
      .eq('type', userStatus)
      .single();

    if (!fetchError && existingDare) {
      return existingDare as DailyDare;
    }

    // Generate new dare
    const dailyDare = getRandomItemWithSeed(dareArray, dateSeed);

    try {
      // Try to insert the new dare
      const { data: newDare, error: insertError } = await supabase
        .from('daily_dares')
        .insert({
          dare: dailyDare,
          date: dateString,
          type: userStatus
        })
        .select()
        .single();

      if (insertError) {
        // If insert fails (e.g., due to race condition), try to get the dare again
        const { data: raceDare, error: raceError } = await supabase
          .from('daily_dares')
          .select('*')
          .eq('date', dateString)
          .eq('type', userStatus)
          .single();

        if (!raceError && raceDare) {
          return raceDare as DailyDare;
        }

        throw insertError;
      }

      return newDare as DailyDare;
    } catch (error) {
      console.error('Error inserting dare:', error);
      // Fallback to local generation
      return {
        dare: dailyDare,
        date: dateString,
        type: userStatus
      };
    }
  } catch (error) {
    console.error('Error getting daily dare:', error);
    // Fallback to local generation
    return {
      dare: getRandomItemWithSeed(dareArray, dateSeed),
      date: dateString,
      type: userStatus
    };
  }
}; 