'use client'

import { useState } from 'react'

interface LoginSignupProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function LoginSignup({ onLogin, onSignup }: LoginSignupProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateBCEmail = (email: string) => {
    return email.toLowerCase().endsWith('@bc.edu')
  }

  const handleLogin = () => {
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

  const handleSignup = () => {
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

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-center text-[#cc0000] font-bold text-4xl mb-8">
        Ophelia
      </h1>

      <input 
        className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors" 
        type="email" 
        placeholder="BC Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />

      <input 
        className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors" 
        type="password" 
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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