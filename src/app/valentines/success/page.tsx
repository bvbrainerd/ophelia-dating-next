'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function ValentinesSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#BA2525] flex flex-col">
      <div className="bg-white">
        <Header variant="matching" />
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-white text-2xl font-semibold mb-8">
            Tell a friend...and double date!
          </h1>
          <Link
            href="/refer"
            className="inline-block bg-white text-[#BA2525] px-8 py-2 rounded-full text-base hover:bg-gray-100 transition-colors"
          >
            Here
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
} 