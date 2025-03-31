'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { Prompt } from 'next/font/google';
import LoginSignup from '@/components/auth/LoginSignup';

const prompt = Prompt({
  weight: ['400', '700'],
  subsets: ['latin']
});

const BACKGROUND_URL = 'https://oyjfhrqfufujmsnqevgr.supabase.co/storage/v1/object/public/venues/background.jpg';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative">
      <Image
        src={BACKGROUND_URL}
        alt="Background"
        fill
        className="object-cover z-0"
        priority
        quality={75}
        sizes="100vw"
      />
      <div className="relative z-10">
        <Header variant="transparent-red" />
        <div className="container mx-auto px-4 py-8">
          <LoginSignup />
        </div>
      </div>
    </div>
  );
}
