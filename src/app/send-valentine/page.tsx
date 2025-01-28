'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';
import Header from '@/components/Header';

// Add SendGrid template ID constant
const VALENTINE_EMAIL_TEMPLATE_ID = 'd-a1c7fe5ed0bc4a4a8074ee622dec27bc';

export default function SendValentinePage() {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!recipientName.trim() || !recipientEmail.trim()) {
        throw new Error('Please fill in all fields');
      }

      if (!recipientEmail.toLowerCase().endsWith('@bc.edu')) {
        throw new Error('Please enter a valid BC email address (@bc.edu)');
      }

      // Get current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Get sender's profile
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, dater_archetype')
        .eq('id', session.user.id)
        .single();

      // Create a valentine request
      const { data: newRequest, error: insertError } = await supabase
        .from('valentine_requests')
        .insert({
          sender_id: session.user.id,
          recipient_email: recipientEmail.toLowerCase(),
          recipient_name: recipientName,
          is_anonymous: isAnonymous,
          status: 'pending',
          sender_archetype: senderProfile?.dater_archetype
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send email to recipient using SendGrid template
      const emailData = {
        templateId: VALENTINE_EMAIL_TEMPLATE_ID,
        to: recipientEmail.toLowerCase(),
        dynamicTemplateData: {
          senderName: isAnonymous ? 'Someone special' : `${senderProfile?.first_name} ${senderProfile?.last_name}`,
          recipientName: recipientName,
          valentineLink: `https://opheliadatingapp.com/valentine/${newRequest.id}`
        }
      };

      // Send the email using our API route
      const emailResponse = await fetch('/api/send-valentine-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!emailResponse.ok) {
        const emailError = await emailResponse.json();
        throw new Error(emailError.error || 'Failed to send email');
      }

      // Redirect to success page
      router.push('/dashboard?valentine=sent');

    } catch (error) {
      console.error('Error sending valentine:', error);
      setError(error instanceof Error ? error.message : 'Failed to send valentine');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto px-5">
        <Header variant="default" />
        
        <div className="mt-6 mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#BA2525] mb-4">Send a Valentine</h1>
          <p className="text-[#BA2525]">
            Ditch love at first swipe, for love at first sight. Send us their name & email...we'll handle the rest.<br /><br />
            Happy Valentine's Day!<br />
            xo Ophelia
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Recipient's Name</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#BA2525] outline-none"
              placeholder="Enter their name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Recipient's Email</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#BA2525] outline-none"
              placeholder="Enter their Email"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mr-2"
              disabled={isLoading}
            />
            <label htmlFor="anonymous" className="text-gray-700">
              Send anonymously
            </label>
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a02020] transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Valentine'}
          </button>
        </form>
      </div>
    </div>
  );
} 