import { Prompt } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={prompt.variable}>
      <body>{children}</body>
    </html>
  );
}
