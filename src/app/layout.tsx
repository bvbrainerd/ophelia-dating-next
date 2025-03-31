import './globals.css';
import { Prompt } from 'next/font/google';
import { createClient } from '@/supabase/server';
import { cookies } from 'next/headers';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const cookieStore = await cookies();
  const authToken = cookieStore.get('sb-oyjfhrqfufujmsnqevgr-auth-token')?.value;

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