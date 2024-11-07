'use client'

import React, { type ButtonHTMLAttributes, type ChangeEvent } from 'react'
import { Prompt } from 'next/font/google'

const prompt = Prompt({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

interface LoginSignupProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function LoginSignup({ onLogin, onSignup }: LoginSignupProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const validateBCEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith('@bc.edu')
  }

  const handleLogin = (): void => {
    if (!validateBCEmail(email)) {
      alert('Please use a valid BC email address')
      return
    }

    setIsLoading(true)
    // Add your login logic here
    setTimeout(() => {
      setIsLoading(false)
      onLogin()
    }, 1000)
  }

  const handleSignup = (): void => {
    if (!validateBCEmail(email)) {
      alert('Please use a valid BC email address')
      return
    }

    setIsLoading(true)
    // Add your signup logic here
    setTimeout(() => {
      setIsLoading(false)
      onSignup()
    }, 1000)
  }

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value)
  }

  return (
    <div className={`max-w-md mx-auto p-5 ${prompt.className}`}>
      <h1 className="text-center text-[#cc0000] font-bold text-4xl mb-8">
        Ophelia
      </h1>

      <input 
        className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors" 
        type="email" 
        placeholder="BC Email"
        value={email}
        onChange={handleEmailChange}
        disabled={isLoading}
      />

      <input 
        className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors" 
        type="password" 
        placeholder="Password"
        value={password}
        onChange={handlePasswordChange}
        disabled={isLoading}
      />

      <button 
        className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleLogin}
        disabled={isLoading || !email || !password}
      >
        {isLoading ? 'Loading...' : 'Log In'}
      </button>

      <button 
        className="w-full p-2.5 mt-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full font-medium hover:bg-[#ffeeee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSignup}
        disabled={isLoading || !email || !password}
      >
        {isLoading ? 'Loading...' : 'Sign Up with BC Email'}
      </button>
    </div>
  )
}