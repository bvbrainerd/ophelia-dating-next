'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function ReferPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/send-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          templateId: 'd-49d22de6ebe54a14aa5cf623198cf512'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send referral email');
      }

      setSuccess(true);
      setEmail('');
      setFullName('');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to send referral email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#BA2525] flex flex-col">
      <div className="bg-white">
        <Header variant="matching" />
      </div>
      
      <div className="flex-1 flex flex-col items-center py-16">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mb-16">
          <div className="text-center mb-8">
            <h1 className="text-[#BA2525] text-2xl font-bold mb-3">
              Refer a Friend ♡
            </h1>
            <p className="text-gray-600 text-sm px-4">
              Introduce your friend to Ophelia to unlock free dates, double dating, and personalized dates experiences for you and your matches!
            </p>
          </div>
          
          {success ? (
            <div className="text-center">
              <p className="text-green-600 mb-4">Invitation sent successfully!</p>
              <button
                onClick={() => setSuccess(false)}
                className="text-[#BA2525] hover:underline"
              >
                Send another invitation
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
              <div>
                <label className="block text-[#BA2525] font-bold mb-2 text-center">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#BA2525] focus:border-[#BA2525] outline-none text-center"
                  required
                  placeholder="Enter Full Name"
                />
              </div>

              <div className="mb-6">
                <label className="block text-[#BA2525] font-bold mb-2 text-center">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#BA2525] focus:border-[#BA2525] outline-none text-center"
                  required
                  placeholder="Enter Email"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#BA2525] text-white p-3 rounded-full text-base hover:bg-[#a02020] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
} 