'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentRedirect() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  
  useEffect(() => {
    if (url) {
      // Open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
      // Go back to previous page after opening new tab
      window.history.back();
    }
  }, [url]);

  if (!url) {
    return <div>No URL provided</div>;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-5">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cc0000] mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-[#BA2525] mb-4">Opening Payment Page</h2>
        <p className="text-gray-600">The payment page will open in a new tab. Please check your browser's popup settings if it doesn't open automatically.</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 inline-block px-4 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#a02020] transition-colors"
        >
          Click here to open payment page
        </a>
      </div>
    </div>
  );
} 