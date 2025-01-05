import { Prompt } from 'next/font/google';
import './globals.css';
import { createServerClient } from '@supabase/ssr'
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
  const cookieStore = await cookies()
  const authToken = cookieStore.get('sb-oyjfhrqfufujmsnqevgr-auth-token')?.value;

  console.log('Auth Token:', authToken);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookie = cookieStore.get(name);
          return cookie ? cookie.value : null;
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

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