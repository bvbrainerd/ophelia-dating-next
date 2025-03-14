'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Space_Mono } from 'next/font/google'
import { useState } from 'react'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin']
})

export default function RoleSelectPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'dater' | 'watcher' | null>(null)
  const [showCursor, setShowCursor] = useState(true)

  // Handle role selection and navigation
  const handleRoleSelect = async (role: 'dater' | 'watcher') => {
    setSelectedRole(role)
    // Store the role in localStorage for use during signup
    localStorage.setItem('selectedRole', role)
    router.push('/auth/signup')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* CRT Screen Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_2px]" />
        <div className="absolute inset-0 opacity-[0.15] animate-[flicker_0.15s_infinite_alternate]" style={{
          background: 'linear-gradient(transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)'
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at center, transparent 10%, rgba(0, 0, 0, 0.8) 100%)'
        }} />
      </div>

      {/* Monitor Frame */}
      <div className="relative w-full max-w-4xl aspect-[4/3] overflow-hidden shadow-2xl" style={{
        borderRadius: '24px',
        background: 'linear-gradient(to bottom, #333, #222)',
        padding: '24px',
        boxShadow: `
          inset 0 0 10px rgba(0,0,0,0.8),
          0 5px 15px rgba(0,0,0,0.5),
          0 15px 35px rgba(0,0,0,0.3)
        `
      }}>
        {/* Screen Bezel */}
        <div className="absolute inset-0 rounded-2xl" style={{
          background: 'linear-gradient(45deg, #111, #222)',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
        }}>
          {/* Screen Content */}
          <div className="absolute inset-[12px] rounded-lg overflow-hidden" style={{
            background: 'radial-gradient(circle at 50% 50%, #FF6E40 0%, #FF3D00 30%, #DD2C00 60%, #BF360C 100%)',
            boxShadow: `
              inset 0 0 30px rgba(0,0,0,0.3),
              0 0 10px rgba(0,0,0,0.2)
            `
          }}>
            {/* Atmospheric overlay */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255,171,64,0.2), transparent 60%), radial-gradient(circle at 50% 50%, rgba(255,110,64,0.15), transparent 70%)',
              mixBlendMode: 'soft-light'
            }} />
            
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-8">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-white text-4xl font-bold mb-16 text-center ${spaceMono.className} [text-shadow:_0_0_10px_rgb(255_255_255_/_60%)]`}
              >
                ARE YOU A DATER OR WATCHER?
                <span className={`inline-block w-[4px] h-[40px] bg-white ml-2 align-middle ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
              </motion.h1>

              <div className="flex gap-8">
                <motion.button
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleRoleSelect('dater')}
                  className={`bg-transparent text-white border-2 border-white px-8 py-3 rounded-[2rem] text-xl font-bold tracking-wider hover:bg-white/10 transition-all ${spaceMono.className} [text-shadow:_0_0_10px_rgb(255_255_255_/_60%)]`}
                >
                  DATER
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleRoleSelect('watcher')}
                  className={`bg-transparent text-white border-2 border-white px-8 py-3 rounded-[2rem] text-xl font-bold tracking-wider hover:bg-white/10 transition-all ${spaceMono.className} [text-shadow:_0_0_10px_rgb(255_255_255_/_60%)]`}
                >
                  WATCHER
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes flicker {
          0% { opacity: 0.85; }
          100% { opacity: 0.95; }
        }
      `}</style>
    </div>
  )
} 