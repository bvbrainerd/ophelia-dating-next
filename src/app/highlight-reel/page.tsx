'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Prompt } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const prompt = Prompt({
  weight: ['400', '700'],
  subsets: ['latin']
});

export default function HighlightReelPage() {
  const router = useRouter();
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [showStatic, setShowStatic] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const staticTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Show skip button after 3 seconds
    const skipTimer = setTimeout(() => {
      setShowSkipButton(true);
    }, 3000);

    return () => {
      clearTimeout(skipTimer);
    };
  }, []);

  // Video initialization
  useEffect(() => {
    let mounted = true;
    const video = videoRef.current;
    
    if (!video) return;

    // Set a timeout to handle stalled loading
    loadTimeoutRef.current = setTimeout(() => {
      if (mounted && videoLoading) {
        console.log('Video load timeout - attempting recovery');
        // Try to recover by reloading the video
        if (video) {
          video.load();
          // Set a final timeout for complete failure
          setTimeout(() => {
            if (mounted && videoLoading) {
              console.log('Video recovery failed - falling back to error state');
              setVideoError(true);
              setVideoLoading(false);
            }
          }, 5000);
        }
      }
    }, 10000);

    const handleLoadStart = () => {
      if (!mounted) return;
      console.log('Video load started');
      setVideoLoading(true);
      setVideoError(false);
    };

    const handleLoadedMetadata = () => {
      if (!mounted) return;
      console.log('Video metadata loaded', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
    };

    const handleLoadedData = () => {
      if (!mounted) return;
      console.log('Video data loaded');
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      setVideoLoading(false);
      setVideoReady(true);
      
      video.play().catch(error => {
        console.error('Initial play attempt failed:', error);
      });
    };

    const handlePlaying = () => {
      if (!mounted) return;
      console.log('Video playing');
      setVideoLoading(false);
      setVideoError(false);
    };

    const handleStalled = () => {
      if (!mounted) return;
      console.log('Video stalled', {
        networkState: video.networkState,
        readyState: video.readyState,
        error: video.error
      });
      
      if (!videoReady) {
        setVideoError(true);
        setVideoLoading(false);
      }
    };

    const handleError = () => {
      if (!mounted) return;
      console.error('Video error:', {
        error: video.error,
        networkState: video.networkState,
        readyState: video.readyState,
        currentSrc: video.currentSrc
      });
      setVideoError(true);
      setVideoLoading(false);
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('error', handleError);

    try {
      video.load();
    } catch (error) {
      console.error('Error loading video:', error);
      setVideoError(true);
      setVideoLoading(false);
    }

    return () => {
      mounted = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (video) {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('stalled', handleStalled);
        video.removeEventListener('error', handleError);
      }
    };
  }, []);

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleVideoEnd = () => {
    router.push('/dashboard');
  };

  useEffect(() => {
    return () => {
      if (staticTimeoutRef.current) {
        clearTimeout(staticTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      {/* Main Container */}
      <div className="relative w-full max-w-[800px] aspect-[4/3] mx-auto">
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#ff3300] via-[#ff2200] to-[#cc1100]">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Ophelia Title Overlay */}
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="w-full max-w-[400px]">
                <Image
                  src="/images/opheliatitle.png"
                  alt="Ophelia Logo"
                  width={400}
                  height={100}
                  className="w-full"
                  priority
                />
              </div>
            </div>

            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover filter grayscale"
              playsInline
              muted
              autoPlay
              preload="auto"
              style={{ 
                opacity: videoReady ? 1 : 0,
                transform: 'scale(2.8)',
                objectFit: 'cover',
                objectPosition: 'center 40%'
              }}
              onEnded={handleVideoEnd}
            >
              <source 
                src="/videos/video.mp4" 
                type="video/mp4"
              />
            </video>
            
            {/* Loading State */}
            {videoLoading && !videoError && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
            
            {/* Fallback Background */}
            {videoError && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black animate-gradient-x"></div>
            )}
          </div>
        </div>
      </div>

      {/* Skip Button */}
      {showSkipButton && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleSkip}
          className={`relative z-50 mt-8 mb-12 px-24 py-2 bg-[#cc0000] text-white border-2 border-white rounded-full font-bold tracking-wider hover:bg-[#aa0000] transition-colors ${prompt.className}`}
        >
          SKIP INTRO
        </motion.button>
      )}

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

        .noise-animated {
          position: absolute;
          inset: -200%;
          width: 400%;
          height: 400%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          animation: noise 0.5s infinite;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
} 