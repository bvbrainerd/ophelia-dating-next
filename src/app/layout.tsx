import { Prompt } from 'next/font/google';
import './globals.css';
import { createClient } from '@/supabase/server';
import { cookies } from 'next/headers'
import { ErrorBoundary } from '@/components/ErrorBoundary';

const prompt = Prompt({
  subsets: ['latin'], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],  
  display: 'swap', 
  variable: '--font-prompt',
});

export const metadata = {
  title: 'Ophelia Dating',
  description: 'College Dating App',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('sb-oyjfhrqfufujmsnqevgr-auth-token')?.value;

  // console.log('Auth Token:', authToken);

  return (
    <html lang="en" className={prompt.variable}>
      <body className={`font-prompt ${prompt.variable}`}>
        <ErrorBoundary>
          <main>{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}