'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

interface Profile {
  first_name: string;
  avatar_url: string | null;
}

export default function Header() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setCurrentUser(data);
        }
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (currentUser?.avatar_url) {
      setAvatarKey(Date.now());
    }
  }, [currentUser?.avatar_url]);

  return (
    <div className="flex items-center mb-6 relative">
      <div className="absolute left-0 right-0 text-center">
        <Link href="/dashboard">
          <h1 className="text-4xl font-bold text-[#cc0000] cursor-pointer hover:opacity-80 transition-opacity">
            Ophelia
          </h1>
        </Link>
      </div>
      {currentUser && (
        <div className="ml-auto flex items-center gap-3 z-10">
          <div className="text-sm font-medium text-[#cc0000]">
            Welcome back, {currentUser.first_name}
          </div>
          <Link href="/dashboard/editprofile">
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full cursor-pointer overflow-hidden">
              {currentUser.avatar_url ? (
                <div className="relative w-10 h-10">
                  <Image
                    key={avatarKey}
                    src={currentUser.avatar_url}
                    alt="Profile"
                    fill
                    sizes="40px"
                    className="object-cover rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-avatar.png';
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 bg-gray-50 rounded-full">
                  <UserCircle className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}