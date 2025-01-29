'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function ValentinesPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    isAnonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Insert valentine request
      const { error: insertError } = await supabase
        .from('valentine_requests')
        .insert({
          sender_id: session.user.id,
          recipient_email: formData.email,
          recipient_name: formData.name,
          is_anonymous: formData.isAnonymous,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Send email notification
      try {
        await fetch('/api/send-valentine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            isAnonymous: formData.isAnonymous,
            senderName: session.user.email
          })
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      // Redirect to success page
      router.push('/valentines/success');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to send Valentine request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header variant="matching" />
      
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold text-[#BA2525] mb-8 text-center">
          Send a Valentine
        </h1>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Recipient's Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Recipient's Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="anonymous" className="text-gray-700">
              Send Anonymously
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#BA2525] text-white p-3 rounded-full font-medium hover:bg-[#a02020] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Valentine'}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
} 