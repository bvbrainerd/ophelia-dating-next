import { Descriptor } from '@/components/DescriptorBubbles';

export interface ProfileImage {
  id: string;
  url: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  preferred_gender?: 'male' | 'female' | 'other';
  school: string;
  location?: string;
  bio: string;
  avatar_url: string | null;
  dater_archetype: 'cautiousDater' | 'hopelessRomantic' | 'serialDater' | 'commitmentSeeker' | 'friendWithBenefits';
  dater_status: 'gold' | 'silver' | 'bronze' | null;
  dater_rating: number;
  follow_through: number;
  average_rating?: number;
  follow_through_rate?: number;
  relationship_status?: 'couple' | 'single' | null;
  couple_preferences?: {
    date_frequency?: string;
    preferred_activities?: string[];
    social_style?: string;
  };
  matchPercentage?: number;
  descriptors: Descriptor[];
  created_at: string;
  updated_at: string;
}

export interface ProfileData {
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  school: string;
  bio: string;
  avatar_url: string;
  descriptors: Descriptor[];
}