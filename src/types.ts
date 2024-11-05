// src/types.ts
export type Page = 
  | 'login' 
  | 'profile' 
  | 'quiz' 
  | 'result' 
  | 'dashboard' 
  | 'matching' 
  | 'dateRequests' 
  | 'payment' 
  | 'editProfile' 
  | 'upcomingDates' 
  | 'previousDates';

export type DateType = {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  rating?: number;
  // Add other date properties here
};