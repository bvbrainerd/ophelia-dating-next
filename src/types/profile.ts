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
  gender: string;
  school: string;
  bio: string;
  avatar_url: string;
  dater_archetype: string;
  dater_status: string;
  dater_rating: number;
  follow_through: number;
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