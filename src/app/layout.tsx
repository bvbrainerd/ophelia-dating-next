import { Prompt } from 'next/font/google';
import './globals.css';
import { createServerClient } from '@supabase/ssr' 
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // expects Supabase credentials to be defined in process.env
                                                                             // Next.js makes the Supabase keys automatically available in the environment
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

  console.log('Auth Token:', authToken);

  // replace createServerClient (deprecated) with createServerComponentClient
  // createServerComponentClient internally calls createClient() from @supabase/supabase-js with 
    // the detected Supabase URL and anon key
    // The Next.js cookies for authentication
  // This means the credentials don't need to be manually passed 
  const supabase = createServerComponentClient({ cookies });

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