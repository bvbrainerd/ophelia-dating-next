import './globals.css';
import { Prompt } from 'next/font/google';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createServerSupabaseClient } from '@/supabase/server';

const prompt = Prompt({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Ophelia Dating',
  description: 'Find your perfect match at Boston College',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // You can use the session information here if needed
    console.log('Session in root layout:', session?.user?.id);
  } catch (error) {
    console.error('Error in root layout:', error);
  }

  return (
    <html lang="en" className={prompt.className}>
      <body className="min-h-screen bg-white">
        <ErrorBoundary fallback={<div>Something went wrong. Please try refreshing the page.</div>}>
          <main>{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}