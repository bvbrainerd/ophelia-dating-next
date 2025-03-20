'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Space_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { useState, useEffect } from 'react'
import '@/styles/animations.css'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const vcrFont = localFont({
  src: '../../public/fonts/VCR_OSD_MONO.ttf',
  display: 'swap',
  variable: '--font-vcr'
})

export default function LandingPage() {
  const router = useRouter()
  const finalText = "DARE TO DATE?"
  const [currentPhase, setCurrentPhase] = useState<'static' | 'welcome' | 'game' | 'fear' | 'leap' | 'logo' | 'final'>('static')
  const [displayText, setDisplayText] = useState("")
  const [showCursor, setShowCursor] = useState(true)
  const [logoExpanded, setLogoExpanded] = useState(false)
  
  const typeText = (text: string, onComplete: () => void) => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(interval)
        setTimeout(onComplete, 1000)
      }
    }, 100)
    return () => clearInterval(interval)
  }

  useEffect(() => {
    // Phase timing sequence
    const sequence = async () => {
      // Start with static
      await new Promise(resolve => setTimeout(resolve, 2000))
      setCurrentPhase('game')
      
      // Ready to play?
      await new Promise(resolve => {
        typeText("LOVE FAVORS THE BOLD.", () => resolve(null))
      })
      
      // Fear is a choice. Make yours
      await new Promise(resolve => setTimeout(resolve, 1500))
      setCurrentPhase('fear')
      await new Promise(resolve => {
        typeText("AND ONLY THE BOLD FIND WHAT'S REAL.", () => resolve(null))
      })
      
      // Take the leap
      await new Promise(resolve => setTimeout(resolve, 1500))
      setCurrentPhase('leap')
      await new Promise(resolve => {
        typeText("TAKE THE LEAP.", () => resolve(null))
      })
      
      // Logo animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      setCurrentPhase('logo')
      await new Promise(resolve => setTimeout(resolve, 2000))
      setLogoExpanded(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Final phase
      setCurrentPhase('final')
      typeText(finalText, () => {})
    }

    sequence()

    // Blinking cursor effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  const renderContent = () => {
    if (currentPhase === 'static') {
      return (
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-[#111]">
            {/* Multiple static noise layers */}
            <div className="absolute inset-0 opacity-50" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              filter: 'contrast(150%) brightness(150%)',
              mixBlendMode: 'screen',
              animation: 'noise1 0.3s steps(1) infinite'
            }} />
            <div className="absolute inset-0 opacity-50" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              filter: 'contrast(150%) brightness(150%)',
              mixBlendMode: 'screen',
              animation: 'noise2 0.3s steps(1) infinite'
            }} />
          </div>
        </div>
      )
    }

    if (currentPhase === 'logo') {
      return (
        <motion.div
          key="logo"
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 1, y: 0 }}
            animate={logoExpanded ? {
              scale: [1, 30],
              opacity: [1, 0],
              y: 0
            } : {
              scale: [1, 1.3, 1],
              y: 0
            }}
            transition={logoExpanded ? {
              duration: 1.5,
              ease: "easeInOut"
            } : {
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute left-[45%] top-[45%] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-white blur-xl" />
              <div className="absolute inset-0 rounded-full bg-white blur-lg" />
              <div className="absolute inset-0 rounded-full bg-white blur-md" />
            </div>
          </motion.div>
        </motion.div>
      )
    }

    if (currentPhase === 'final') {
      return (
        <motion.div
          key="final-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 h-full flex flex-col items-center"
        >
          <div className="flex-1 flex flex-col items-center justify-start pt-24 w-full space-y-12">
            <h1 className={`${vcrFont.className} text-white tracking-[0.25em] whitespace-nowrap flex justify-center vhs-text text-[3.5rem]`}>
              {displayText}
              <span className={`inline-block w-[0.6em] h-[1em] bg-white -mb-[0.2em] ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'} vhs-cursor`} />
            </h1>

            <p className={`${vcrFont.className} text-white text-base vhs-text`}>
              PRESS START
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative inline-block">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                onClick={() => router.push('/auth/signup')}
                className={`${vcrFont.className} bg-transparent text-white border-2 border-white px-24 py-2 text-lg vhs-text relative z-10 rounded-full hover:bg-white/10 transition-colors`}
              >
                START
              </motion.button>
              <div className="absolute inset-0 rounded-full border-2 border-white glow-effect"></div>
            </div>
          </div>

          <div className="w-full flex justify-center pb-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className={`${vcrFont.className} text-[0.65rem] text-white vhs-text opacity-90`}
            >
              LOVE, THE WAY IT WAS MEANT TO BE.
            </motion.p>
          </div>
        </motion.div>
      )
    }

    // Default text display for other phases
    return (
      <div className="h-full flex items-center justify-center">
        <h1 className={`${vcrFont.className} text-white whitespace-nowrap flex items-center vhs-text max-w-[90vw] text-center ${
          displayText.length > 30 ? 'text-[1.35rem]' : 'text-[1.75rem]'
        } tracking-[0.15em]`}>
          {displayText}
          <span className={`inline-block w-[0.6em] h-[1em] bg-white -mb-[0.2em] ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'} vhs-cursor`} />
        </h1>
      </div>
    )
  }

  return (
    <div className={`${vcrFont.className} min-h-screen bg-black flex flex-col items-center justify-center relative`}>
      <div className="relative w-full max-w-[800px] aspect-[4/3] mx-auto">
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#ff3300] via-[#ff2200] to-[#cc1100]">
          <div className="relative w-full h-full flex flex-col items-center justify-center px-12">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}