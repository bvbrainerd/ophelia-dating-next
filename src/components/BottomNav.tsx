'use client';

import { useRouter } from 'next/navigation';
import { Home, Heart, Bell, User, PlusCircle } from 'lucide-react';
import { Prompt } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../supabase/client';

const prompt = Prompt({
  weight: ['400', '700'],
  subsets: ['latin']
});

interface Profile {
  id: string;
  relationship_status?: 'single' | 'in_relationship' | 'couple' | null;
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, relationship_status')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#aa0000] border-t border-white py-1.5 px-3 z-50">
      <div className="max-w-2xl mx-auto flex justify-between items-center">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>HOME</span>
        </Link>
        
        <Link
          href="/matching"
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <Heart className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>
            {userProfile?.relationship_status === 'couple' ? 'DATES' : 'MATCH'}
          </span>
        </Link>

        <Link
          href="/challenges"
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>POST</span>
        </Link>
        
        <Link
          href="/daterequests"
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>ALERTS</span>
        </Link>
        
        <Link
          href="/dashboard/editprofile"
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>PROFILE</span>
        </Link>
      </div>
    </div>
  );
}
