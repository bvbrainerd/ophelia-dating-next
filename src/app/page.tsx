'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Space_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { useState, useEffect } from 'react'

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

      <style jsx global>{`
        @keyframes flicker {
          0% { opacity: 0.85; }
          100% { opacity: 0.95; }
        }
        
        @keyframes noise1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.9; }
          10% { transform: translate(-1%, -1%); opacity: 0.8; }
          20% { transform: translate(1%, 1%); opacity: 0.9; }
          30% { transform: translate(-1%, 1%); opacity: 0.7; }
          40% { transform: translate(1%, -1%); opacity: 0.9; }
          50% { transform: translate(-1%, -0.5%); opacity: 0.8; }
          60% { transform: translate(1%, 0.5%); opacity: 0.9; }
          70% { transform: translate(-0.5%, 1%); opacity: 0.7; }
          80% { transform: translate(0.5%, -1%); opacity: 0.9; }
          90% { transform: translate(-1%, 0.5%); opacity: 0.8; }
        }

        @keyframes noise2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.9; }
          10% { transform: translate(1%, 1%); opacity: 0.8; }
          20% { transform: translate(-1%, -1%); opacity: 0.9; }
          30% { transform: translate(1%, -1%); opacity: 0.7; }
          40% { transform: translate(-1%, 1%); opacity: 0.9; }
          50% { transform: translate(1%, 0.5%); opacity: 0.8; }
          60% { transform: translate(-1%, -0.5%); opacity: 0.9; }
          70% { transform: translate(0.5%, -1%); opacity: 0.7; }
          80% { transform: translate(-0.5%, 1%); opacity: 0.9; }
          90% { transform: translate(1%, -0.5%); opacity: 0.8; }
        }

        @keyframes glitch {
          0% {
            text-shadow: 0.05em 0 0 rgba(255,0,0,0.75),
                        -0.05em -0.025em 0 rgba(0,255,0,0.75),
                        -0.025em 0.05em 0 rgba(0,0,255,0.75);
          }
          14% {
            text-shadow: 0.05em 0 0 rgba(255,0,0,0.75),
                        -0.05em -0.025em 0 rgba(0,255,0,0.75),
                        -0.025em 0.05em 0 rgba(0,0,255,0.75);
          }
          15% {
            text-shadow: -0.05em -0.025em 0 rgba(255,0,0,0.75),
                        0.025em 0.025em 0 rgba(0,255,0,0.75),
                        -0.05em -0.05em 0 rgba(0,0,255,0.75);
          }
          49% {
            text-shadow: -0.05em -0.025em 0 rgba(255,0,0,0.75),
                        0.025em 0.025em 0 rgba(0,255,0,0.75),
                        -0.05em -0.05em 0 rgba(0,0,255,0.75);
          }
          50% {
            text-shadow: 0.025em 0.05em 0 rgba(255,0,0,0.75),
                        0.05em 0 0 rgba(0,255,0,0.75),
                        0 -0.05em 0 rgba(0,0,255,0.75);
          }
          99% {
            text-shadow: 0.025em 0.05em 0 rgba(255,0,0,0.75),
                        0.05em 0 0 rgba(0,255,0,0.75),
                        0 -0.05em 0 rgba(0,0,255,0.75);
          }
          100% {
            text-shadow: -0.025em 0 0 rgba(255,0,0,0.75),
                        -0.025em -0.025em 0 rgba(0,255,0,0.75),
                        -0.025em -0.05em 0 rgba(0,0,255,0.75);
          }
        }

        .vhs-text {
          font-family: inherit;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          position: relative;
          color: #ffffff;
          filter: none;
          font-weight: normal;
          -webkit-text-stroke: 0.5px #ffffff;
          text-shadow: 
            0 0 2px rgba(255, 255, 255, 0.8),
            0 0 4px rgba(255, 255, 255, 0.6),
            0 0 6px rgba(255, 255, 255, 0.4),
            0 0 8px rgba(255, 255, 255, 0.3);
        }

        .text-title {
          font-size: clamp(2rem, 5vw, 4rem);
          letter-spacing: 0.25em;
        }

        .glow-effect {
          filter: blur(8px);
          opacity: 0.6;
        }

        @keyframes textPulse {
          0%, 100% {
            opacity: 1;
            text-shadow: 
              0 0 7px #fff,
              0 0 10px #fff,
              0 0 21px #fff,
              0 0 42px rgba(255, 255, 255, 0.5),
              0 0 82px rgba(255, 255, 255, 0.3),
              0 0 92px rgba(255, 255, 255, 0.2),
              0 0 102px rgba(255, 255, 255, 0.1),
              0 0 151px rgba(255, 255, 255, 0.1);
          }
          50% {
            opacity: 0.95;
            text-shadow: 
              0 0 4px #fff,
              0 0 7px #fff,
              0 0 18px #fff,
              0 0 38px rgba(255, 255, 255, 0.4),
              0 0 78px rgba(255, 255, 255, 0.2),
              0 0 88px rgba(255, 255, 255, 0.1),
              0 0 98px rgba(255, 255, 255, 0.1),
              0 0 148px rgba(255, 255, 255, 0.1);
          }
        }

        .glitch-text {
          animation: glitch 3s infinite;
          position: relative;
          &:before,
          &:after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          &:before {
            left: 2px;
            text-shadow: 2px 0 #ff000080;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim 5s infinite linear alternate-reverse;
          }
          &:after {
            left: -2px;
            text-shadow: -2px 0 #0080ff80;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim2 1s infinite linear alternate-reverse;
            opacity: 0.7;
          }
        }

        @keyframes glitch-anim {
          0% {
            clip: rect(31px, 9999px, 94px, 0);
          }
          4.166666666666666% {
            clip: rect(91px, 9999px, 43px, 0);
          }
          8.333333333333332% {
            clip: rect(15px, 9999px, 13px, 0);
          }
          12.5% {
            clip: rect(75px, 9999px, 57px, 0);
          }
          16.666666666666664% {
            clip: rect(83px, 9999px, 66px, 0);
          }
          20.833333333333336% {
            clip: rect(46px, 9999px, 27px, 0);
          }
          25% {
            clip: rect(48px, 9999px, 51px, 0);
          }
          29.166666666666668% {
            clip: rect(60px, 9999px, 16px, 0);
          }
          33.33333333333333% {
            clip: rect(19px, 9999px, 92px, 0);
          }
          37.5% {
            clip: rect(71px, 9999px, 88px, 0);
          }
          41.66666666666667% {
            clip: rect(2px, 9999px, 14px, 0);
          }
          45.83333333333333% {
            clip: rect(54px, 9999px, 73px, 0);
          }
          50% {
            clip: rect(45px, 9999px, 70px, 0);
          }
          54.166666666666664% {
            clip: rect(75px, 9999px, 85px, 0);
          }
          58.333333333333336% {
            clip: rect(62px, 9999px, 70px, 0);
          }
          62.5% {
            clip: rect(35px, 9999px, 39px, 0);
          }
          66.66666666666666% {
            clip: rect(25px, 9999px, 71px, 0);
          }
          70.83333333333334% {
            clip: rect(39px, 9999px, 49px, 0);
          }
          75% {
            clip: rect(50px, 9999px, 87px, 0);
          }
          79.16666666666666% {
            clip: rect(64px, 9999px, 69px, 0);
          }
          83.33333333333334% {
            clip: rect(31px, 9999px, 45px, 0);
          }
          87.5% {
            clip: rect(27px, 9999px, 86px, 0);
          }
          91.66666666666666% {
            clip: rect(44px, 9999px, 62px, 0);
          }
          95.83333333333334% {
            clip: rect(58px, 9999px, 57px, 0);
          }
          100% {
            clip: rect(100px, 9999px, 99px, 0);
          }
        }

        @keyframes glitch-anim2 {
          6.666666666666667% {
            clip: rect(24px, 9999px, 92px, 0);
          }
          10% {
            clip: rect(88px, 9999px, 44px, 0);
          }
          13.333333333333334% {
            clip: rect(50px, 9999px, 84px, 0);
          }
          16.666666666666664% {
            clip: rect(72px, 9999px, 59px, 0);
          }
          20% {
            clip: rect(77px, 9999px, 29px, 0);
          }
          23.333333333333332% {
            clip: rect(28px, 9999px, 65px, 0);
          }
          26.666666666666668% {
            clip: rect(81px, 9999px, 5px, 0);
          }
          30% {
            clip: rect(71px, 9999px, 58px, 0);
          }
          33.33333333333333% {
            clip: rect(36px, 9999px, 78px, 0);
          }
          36.666666666666664% {
            clip: rect(63px, 9999px, 27px, 0);
          }
          40% {
            clip: rect(28px, 9999px, 61px, 0);
          }
          43.333333333333336% {
            clip: rect(86px, 9999px, 85px, 0);
          }
          46.666666666666664% {
            clip: rect(4px, 9999px, 91px, 0);
          }
          50% {
            clip: rect(91px, 9999px, 87px, 0);
          }
          53.333333333333336% {
            clip: rect(99px, 9999px, 26px, 0);
          }
          56.666666666666664% {
            clip: rect(56px, 9999px, 55px, 0);
          }
          60% {
            clip: rect(81px, 9999px, 91px, 0);
          }
          63.33333333333333% {
            clip: rect(77px, 9999px, 95px, 0);
          }
          66.66666666666667% {
            clip: rect(28px, 9999px, 35px, 0);
          }
          70% {
            clip: rect(7px, 9999px, 94px, 0);
          }
          73.33333333333333% {
            clip: rect(15px, 9999px, 94px, 0);
          }
          76.66666666666667% {
            clip: rect(40px, 9999px, 88px, 0);
          }
          80% {
            clip: rect(57px, 9999px, 57px, 0);
          }
          83.33333333333334% {
            clip: rect(98px, 9999px, 58px, 0);
          }
          86.66666666666666% {
            clip: rect(10px, 9999px, 89px, 0);
          }
          90% {
            clip: rect(23px, 9999px, 41px, 0);
          }
          93.33333333333333% {
            clip: rect(49px, 9999px, 26px, 0);
          }
          96.66666666666667% {
            clip: rect(3px, 9999px, 76px, 0);
          }
          100% {
            clip: rect(42px, 9999px, 78px, 0);
          }
        }

        .vhs-cursor {
          box-shadow: 
            0 0 5px rgba(255, 255, 255, 0.9),
            0 0 10px rgba(255, 255, 255, 0.8),
            0 0 15px rgba(255, 255, 255, 0.7),
            0 0 20px rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  )
}