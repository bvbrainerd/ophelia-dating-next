'use client'

import React, { type ButtonHTMLAttributes, type ChangeEvent } from 'react'
import { Prompt } from 'next/font/google'
import Image from 'next/image'

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
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

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

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setAvatarFile(file)
  }

  return (
    <div className={`max-w-md mx-auto p-5 ${prompt.className}`}>
      <h1 className="text-center text-[#cc0000] font-bold text-4xl mb-8">
        Ophelia
      </h1>

      <div className="flex items-center justify-center w-full mb-6">
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
          {previewUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={previewUrl}
                alt="Profile preview"
                fill
                className="object-cover rounded-full"
                sizes="(max-width: 768px) 100vw, 128px"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className="mb-2 text-xs text-gray-500 text-center">
                Add Photo
              </p>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isLoading}
          />
        </label>
      </div>

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