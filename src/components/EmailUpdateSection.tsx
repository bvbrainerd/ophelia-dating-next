'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';

interface EmailUpdateSectionProps {
  onEmailChange: (email: string) => void;
}

export default function EmailUpdateSection({ onEmailChange }: EmailUpdateSectionProps) {
  const [currentEmail, setCurrentEmail] = useState('');

  // Fetch current user's email on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentEmail(user.email);
      }
    };
    getCurrentUser();
  }, []);

  return (
    <input
      type="email"
      placeholder="Email"
      value={currentEmail}
      onChange={(e) => {
        setCurrentEmail(e.target.value);
        onEmailChange(e.target.value);
      }}
      className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
    />
  );
} 