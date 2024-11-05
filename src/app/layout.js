// app/layout.js
import './globals.css'
import { Prompt } from 'next/font/google'

const prompt = Prompt({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-prompt', // Add this to use with Tailwind
})

export const metadata = {
  title: 'Ophelia Dating App',
  description: 'College Dating App',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${prompt.variable} font-sans`}>
      <body className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4">{children}</main>
      </body>
    </html>
  )
}

// lib/styles.js
export const styleConfig = {
  colors: {
    primary: '#cc0000',
    text: '#333333',
  },
  borderRadius: '20px',
}

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-prompt)'],
      },
      colors: {
        primary: '#cc0000',
      },
      borderRadius: {
        custom: '20px',
      },
    },
  },
  plugins: [],
}

