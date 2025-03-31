'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Prompt } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import '@/styles/animations.css';

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

    // Log the video URL being attempted
    console.log('Attempting to load video from:', '/videos/highlightreel.mp4');

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
              console.error('Video recovery failed - falling back to error state');
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
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState
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
        setVideoError(true);
      });
    };

    const handleError = () => {
      if (!mounted) return;
      console.error('Video error:', {
        error: video.error?.message,
        code: video.error?.code,
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
    video.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      mounted = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (video) {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-2xl">
          {/* TV Frame and Video Container */}
          <div className="relative aspect-[4/3] rounded-[60px] overflow-hidden shadow-2xl border-4 border-black bg-black">
            {/* Video */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover filter grayscale"
              playsInline
              muted
              autoPlay
              loop
              preload="auto"
              src="/videos/highlightreel.mp4"
              onEnded={handleVideoEnd}
            >
              Your browser does not support the video tag.
            </video>

            {/* Centered Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <h1 className={`text-white text-5xl md:text-6xl font-bold mb-4 ${prompt.className}`}>
                Ophelia
              </h1>
              <p className={`text-white/90 text-lg md:text-xl ${prompt.className}`}>
                Reviving the experience of in-person dating
              </p>
            </div>

            {/* Loading Overlay */}
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* Button below video */}
          {showSkipButton && (
            <button
              onClick={handleSkip}
              className={`mt-8 mb-16 px-8 py-2 bg-[#cc0000] text-white border border-white rounded-full hover:bg-[#aa0000] transition-colors ${prompt.className} text-base font-bold mx-auto block w-36`}
            >
              Skip Intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 