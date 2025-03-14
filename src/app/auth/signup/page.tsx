'use client';

import SignUp from '@/components/auth/SignUp';
import Header from '@/components/Header';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header variant="logo-only" />
      <div className="container mx-auto px-4 py-8">
        <SignUp />
      </div>
    </div>
  );
}