'use client'

import React from 'react'

interface LoginSignupProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({ onLogin, onSignup }) => {
  return (
    <div className="max-w-md mx-auto p-5">
      {/* Updated heading with larger size */}
      <h1 className="text-center text-[#cc0000] font-bold text-4xl mb-8">
        Ophelia
      </h1>
      
      <input 
        className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none" 
        type="email" 
        placeholder="BC Email" 
      />
      
      <input 
        className="w-full p-2.5 mb-2.5 border border-gray-200 rounded-full outline-none" 
        type="password" 
        placeholder="Password" 
      />
      
      <button 
        className="w-full p-2.5 bg-[#cc0000] text-white rounded-full cursor-pointer font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onLogin}
      >
        Log In
      </button>
      
      <button 
        className="w-full p-2.5 mt-2.5 bg-white text-[#cc0000] border-2 border-[#cc0000] rounded-full cursor-pointer font-medium hover:bg-[#ffeeee] transition-colors"
        onClick={onSignup}
      >
        Sign Up with BC Email
      </button>
    </div>
  )
}

export default LoginSignup