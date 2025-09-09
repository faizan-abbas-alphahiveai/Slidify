import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2, ImageOff, RotateCcw, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { supabase, type Slideshow, getPublicUrl, getRandomTagline, incrementSlideshowView } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import EndSlideshowModal from './EndSlideshowModal';
import ThemeToggle from './ThemeToggle';

interface TransitionConfig {
  name: string;
  fullscreen: {
    initial: any;
    animate: any;
    exit: any;
  };
}


/*    REFACTOR START
*/

const defaultTransition = {
  duration: 0.6,
  ease: 'easeOut'
};

const transitionConfigs: Record<string, TransitionConfig> = {
  fadeBlack: {
    name: 'Fade through black',
    fullscreen: {
      initial: { opacity: 0, scale: 1.05, transition: defaultTransition },
      animate: { opacity: 1, scale: 1, transition: defaultTransition },
      exit: { opacity: 0, scale: 0.95, transition: defaultTransition }
    }
  },
  fade: {
    name: 'Fade',
    fullscreen: {
      initial: { opacity: 0, transition: defaultTransition },
      animate: { opacity: 1, transition: defaultTransition },
      exit: { opacity: 0, transition: defaultTransition }
    }
  },
  slide: {
    name: 'Slide',
    fullscreen: {
      initial: { opacity: 0, x: 100, transition: defaultTransition },
      animate: { opacity: 1, x: 0, transition: defaultTransition },
      exit: { opacity: 0, x: -100, transition: defaultTransition }
    }
  },
  scale: {
    name: 'Scale',
    fullscreen: {
      initial: { opacity: 0, scale: 0.8, transition: defaultTransition },
      animate: { opacity: 1, scale: 1, transition: defaultTransition },
      exit: { opacity: 0, scale: 1.2, transition: defaultTransition }
    }
  },
  flip: {
    name: 'Flip',
    fullscreen: {
      initial: {
        opacity: 0,
        rotateY: 90,
        transformPerspective: 1000,
        transition: defaultTransition
      },
      animate: {
        opacity: 1,
        rotateY: 0,
        transformPerspective: 1000,
        transition: defaultTransition
      },
      exit: {
        opacity: 0,
        rotateY: -90,
        transformPerspective: 1000,
        transition: defaultTransition
      }
    }
  },
  slideUp: {
    name: 'Slide Up',
    fullscreen: {
      initial: { opacity: 0, y: 100, transition: defaultTransition },
      animate: { opacity: 1, y: 0, transition: defaultTransition },
      exit: { opacity: 0, y: -100, transition: defaultTransition }
    }
  },
  zoom: {
    name: 'Zoom',
    fullscreen: {
      initial: { opacity: 0, scale: 0.5, transition: defaultTransition },
      animate: { opacity: 1, scale: 1, transition: defaultTransition },
      exit: { opacity: 0, scale: 1.5, transition: defaultTransition }
    }
  },
  slideFade: {
    name: 'Slide + Fade',
    fullscreen: {
      initial: { opacity: 0, x: 100, transition: defaultTransition },
      animate: { opacity: 1, x: 0, transition: defaultTransition },
      exit: { opacity: 0, x: -100, transition: defaultTransition }
    }
  },
};

interface SlideshowViewerProps {
  slideshowId: string;
  initialSlideshow?: Partial<Slideshow>;
  mode?: 'view' | 'embedded-preview' | 'modal-preview';
  onClose?: () => void;
  onEnd?: () => void;
}

export default function SlideshowViewer({ slideshowId, initialSlideshow, mode = 'view', onClose, onEnd }: SlideshowViewerProps) {
  const { user, getDisplayName, signOut } = useAuth();
  const [slideshow, setSlideshow] = useState<Slideshow | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(mode === 'view' || mode === 'modal-preview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntroOverlay, setShowIntroOverlay] = useState(mode === 'view' || mode === 'modal-preview');
  const [showEndModal, setShowEndModal] = useState(false);
  const [currentSlideshowData, setCurrentSlideshowData] = useState<{ name: string; message: string; link: string } | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [tagline, setTagline] = useState('Create beautiful slideshows with a few simple clicks');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const lottieAnimationUrl = getPublicUrl('lottie-animations', 'Slide.Animation.json');

  useEffect(() => {
    if (initialSlideshow) {
      // Use the provided initial slideshow data for temporary slideshows
      setSlideshow(initialSlideshow as Slideshow);
      setIsLoading(false);
    } else if (slideshowId && slideshowId !== 'temp') {
      // Only load from database if not a temporary slideshow
      loadSlideshow();
    }
    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [slideshowId, initialSlideshow]);

  // Load random tagline on component mount
  useEffect(() => {
    const loadTagline = async () => {
      try {
        const randomTagline = await getRandomTagline();
        setTagline(randomTagline);
      } catch (error) {
        console.error('Error loading tagline:', error);
        // Keep default tagline if loading fails
      }
    };

    loadTagline();
  }, []);

  const loadSlideshow = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('slideshows')
        .select('*')
        .eq('id', slideshowId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Slideshow not found');

      setSlideshow(data);
    } catch (error) {
      console.error('Error loading slideshow:', error);
      setError('Failed to load slideshow');
    } finally {
      setIsLoading(false);
    }
  };

  const startSlideshow = () => {
    if (!slideshow || slideshow.slide_urls.length === 0) return;
    
    setShowIntroOverlay(false);
    setIsPlaying(true);
    
    // Track slideshow view (only for saved slideshows, not previews)
    if (slideshowId && slideshowId !== 'temp' && mode === 'view') {
      incrementSlideshowView(slideshowId);
    }
    
    // Start audio playback with a slight delay to ensure audio element is ready
    setTimeout(() => {
      if (audioRef.current && slideshow.audio_url) {
        audioRef.current.currentTime = 0; // Reset to beginning
        audioRef.current.play().catch(error => {
          console.error('Audio playback failed:', error);
        });
      }
    }, 100);
    
    // Function to get slide duration based on slide index
    const getSlideDuration = (slideIndex: number) => {
      const isFirstSlide = slideIndex === 0;
      const isLastSlide = slideIndex === slideshow.slide_urls.length - 1;
      
      if (isFirstSlide || isLastSlide) {
        return (slideshow.slide_duration + 1.5) * 1000; // Add 1.5 seconds
      }
      return slideshow.slide_duration * 1000;
    };
    
    // Start with first slide duration (extended)
    const scheduleNextSlide = (currentIndex: number) => {
      const duration = getSlideDuration(currentIndex);
      
      slideIntervalRef.current = setTimeout(() => {
        setCurrentSlide(prev => {
          const nextSlide = (prev + 1) % slideshow.slide_urls.length;
          // Check if we've completed a full cycle
          if (nextSlide === 0 && prev === slideshow.slide_urls.length - 1) {
            // Stop slideshow but keep audio playing
            setIsPlaying(false);
            if (slideIntervalRef.current) {
              clearTimeout(slideIntervalRef.current);
            }
            // Set current slideshow data for end modal
            setCurrentSlideshowData({
              name: slideshow.name,
              message: slideshow.message || '',
              link: window.location.href
            });
            setShowEndModal(true);
            return prev; // Don't advance to next slide
          }
          
          // Schedule the next slide transition
          scheduleNextSlide(nextSlide);
          return nextSlide;
        });
      }, duration);
    };
    
    // Start the scheduling with the first slide (index 0)
    scheduleNextSlide(0);
  };

  const pauseSlideshow = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (slideIntervalRef.current) {
      clearTimeout(slideIntervalRef.current);
    }
  };

  const nextSlide = () => {
    if (!slideshow) return;
    setCurrentSlide(prev => {
      const nextSlide = (prev + 1) % slideshow.slide_urls.length;
      // Check if we've reached the end
      if (nextSlide === 0) {
        // Show end modal
        setCurrentSlideshowData({
          name: slideshow.name,
          message: slideshow.message || '',
          link: window.location.href
        });
        setShowEndModal(true);
        return prev; // Don't advance to next slide
      }
      return nextSlide;
    });
  };

  const prevSlide = () => {
    if (!slideshow) return;
    setCurrentSlide(prev => (prev - 1 + slideshow.slide_urls.length) % slideshow.slide_urls.length);
  };

  const restartSlideshow = () => {
    if (!slideshow) return;
    
    // Stop current playback
    pauseSlideshow();
    
    // Reset to first slide
    setCurrentSlide(0);
    
    // Reset audio to beginning
    if (audioRef.current && slideshow.audio_url) {
      audioRef.current.currentTime = 0;
    }
    
    // Start slideshow from beginning
    setTimeout(() => {
      startSlideshow();
    }, 100);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRestart = () => {
    setCurrentSlide(0);
    setShowEndModal(false);
    setCurrentSlideshowData(null);
    startSlideshow();
  };

  const handleCloseEndModal = () => {
    setShowEndModal(false);
    setCurrentSlideshowData(null);
  };

  const handleImageError = (slideIndex: number) => {
    setImageErrors(prev => new Set(prev).add(slideIndex));
  };

  const isImageBroken = (slideIndex: number) => {
    return imageErrors.has(slideIndex);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading slideshow...</p>
        </div>
      </div>
    );
  }

  if (error || !slideshow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Slideshow Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested slideshow could not be found.'}</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Slidify
          </a>
        </div>
      </div>
    );
  }

  const transitionConfig = transitionConfigs[slideshow.transition_type] || transitionConfigs.fade;

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-950 z-50 flex items-center justify-center touch-manipulation">
        {/* Intro Overlay */}
        {showIntroOverlay && (
          <div className="absolute inset-0 bg-white/95 dark:bg-gray-950/90 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            {/* Theme Toggle - Top Right in Intro Overlay */}
            <div className="absolute top-4 right-4 z-70">
              <ThemeToggle />
            </div>
            
            <div className="text-center max-w-md w-full">
              {/* Header matching main app */}
              <div className="mb-8">
                <div className="flex justify-center mb-4">
                  <Lottie 
                    path={lottieAnimationUrl}
                    loop={true}
                    autoplay={true}
                    style={{ width: 120, height: 120 }}
                  />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  Slidify.app
                </h1>
                <p className="text-lg text-gray-600 dark:text-white/70 mb-2">{tagline}</p>
              </div>

              {/* Slideshow Info */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                  {slideshow.name}
                </h2>
                {slideshow.message && (
                  <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 rounded-lg p-4 mb-6">
                    <p className="text-gray-700 dark:text-white/90 italic text-sm sm:text-base">
                      "{slideshow.message}"
                    </p>
                  </div>
                )}
                <div className="text-gray-500 dark:text-white/60 text-sm space-y-1">

                </div>
              </div>

              {/* Play Button */}
              <button
                onClick={startSlideshow}
                className="group relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 hover:scale-105"
              >
                <Play size={32} className="text-white ml-1 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <p className="text-gray-600 dark:text-white/70 text-sm mt-4">Click to start slideshow</p>
            </div>
          </div>
        )}
        
        {/* Slideshow Content - Only show when intro overlay is hidden */}
        {!showIntroOverlay && (
          <>
            {/* Theme Toggle - Top Right in Fullscreen */}
            <div className="absolute top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            
            <div className="relative w-full h-full">
              {isImageBroken(currentSlide) ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                  <div className="text-center text-gray-800 dark:text-white">
                    <ImageOff size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Image not available</p>
                    <p className="text-sm opacity-70">Slide {currentSlide + 1}</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${slideshow.id}-${currentSlide}`}
                    src={slideshow.slide_urls[currentSlide]}
                    alt={`Slide ${currentSlide + 1}`}
                    className="w-full h-full object-contain select-none"
                    initial={transitionConfig.fullscreen.initial}
                    animate={transitionConfig.fullscreen.animate}
                    exit={transitionConfig.fullscreen.exit}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    onError={() => handleImageError(currentSlide)}
                  />
                </AnimatePresence>
              )}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-black/70 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3">
                <button
                  onClick={prevSlide}
                  className="p-2 sm:p-2 text-white hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                >
                  <SkipBack size={18} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={isPlaying ? pauseSlideshow : startSlideshow}
                  className="p-3 sm:p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all touch-manipulation"
                >
                  {isPlaying ? <Pause size={20} className="sm:w-5 sm:h-5" /> : <Play size={20} className="sm:w-5 sm:h-5" />}
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 sm:p-2 text-white hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                >
                  <SkipForward size={18} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 sm:p-2 text-white hover:bg-white/20 rounded-full transition-colors ml-1 sm:ml-2 touch-manipulation"
                >
                  <Minimize2 size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-gray-800 dark:text-white bg-white/80 dark:bg-black/70 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base">
                {currentSlide + 1} / {slideshow.slide_urls.length}
              </div>
              
              {/* Mobile swipe areas for navigation */}
              <div 
                className="absolute left-0 top-0 w-1/3 h-full z-10 md:hidden"
                onClick={prevSlide}
              />
              <div 
                className="absolute right-0 top-0 w-1/3 h-full z-10 md:hidden"
                onClick={nextSlide}
              />
            </div>
            {slideshow.audio_url && (
              <audio 
                ref={audioRef} 
                src={slideshow.audio_url} 
                loop={slideshow.loop_enabled}
                preload="auto"
                className="hidden" 
              />
            )}
          </>
        )}
        
        {/* End Slideshow Modal */}
        {currentSlideshowData && mode === 'view' && (
          <EndSlideshowModal
            isOpen={showEndModal}
            onClose={handleCloseEndModal}
            onRestart={handleRestart}
            slideshowName={currentSlideshowData.name}
            slideshowMessage={currentSlideshowData.message}
            shareableLink={currentSlideshowData.link}
            slideshowId={slideshow?.id}
          />
        )}
      </div>
    );
  }

  // Embedded preview mode - simplified layout
  if (mode === 'embedded-preview') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-colors">
        <div className="relative w-full h-96 bg-gray-900">
          {isImageBroken(currentSlide) ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <div className="text-center text-gray-800 dark:text-white">
                <ImageOff size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg mb-1">Image not available</p>
                <p className="text-sm opacity-70">Slide {currentSlide + 1}</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.img
                key={`${slideshow?.id}-${currentSlide}`}
                src={slideshow?.slide_urls[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="w-full h-full object-cover"
                initial={transitionConfig.fullscreen.initial}
                animate={transitionConfig.fullscreen.animate}
                exit={transitionConfig.fullscreen.exit}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                onError={() => handleImageError(currentSlide)}
              />
            </AnimatePresence>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 text-gray-800 dark:text-white bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
            {currentSlide + 1} / {slideshow?.slide_urls.length}
          </div>
        </div>

        {/* Controls */}
        <div className="p-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={restartSlideshow}
              className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Restart slideshow"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={prevSlide}
              className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={isPlaying ? pauseSlideshow : startSlideshow}
              className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={nextSlide}
              className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / (slideshow?.slide_urls.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Hidden Audio Element */}
        {slideshow?.audio_url && (
          <audio ref={audioRef} src={slideshow.audio_url} className="hidden" />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <div className="transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            {/* Theme Toggle - Top Left */}
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
            
            <div className="text-center flex-1 relative">
              <div className="flex justify-center mb-4">
                <Lottie 
                  path={lottieAnimationUrl}
                  loop={true}
                  autoplay={true}
                  style={{ width: 120, height: 120 }}
                />
              </div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Slidify.app</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">Viewing: {slideshow?.name}</p>
              
              <div className="flex justify-center">
                {user ? (
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {getDisplayName()}
                    </span>
                    <button
                      onClick={signOut}
                      className="p-2 text-purple-600 hover:text-pink-600 dark:text-purple-400 dark:hover:text-pink-400 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <a
                    href="/"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 text-sm"
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </a>
                )}
              </div>
            </div>
            
            {/* Spacer for balance */}
            <div className="flex-shrink-0 w-10">
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-8">
        {/* Slideshow Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
          <div className="relative w-full h-96 bg-gray-900">
            {isImageBroken(currentSlide) ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <ImageOff size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-lg mb-1">Image not available</p>
                  <p className="text-sm opacity-70">Slide {currentSlide + 1}</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${slideshow.id}-${currentSlide}`}
                  src={slideshow.slide_urls[currentSlide]}
                  alt={`Slide ${currentSlide + 1}`}
                  className="w-full h-full object-cover"
                  initial={transitionConfig.fullscreen.initial}
                  animate={transitionConfig.fullscreen.animate}
                  exit={transitionConfig.fullscreen.exit}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  onError={() => handleImageError(currentSlide)}
                />
              </AnimatePresence>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
              {currentSlide + 1} / {slideshow.slide_urls.length}
            </div>
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-colors"
              style={{ display: mode === 'embedded-preview' ? 'none' : 'block' }}
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Controls */}
          <div className="p-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              {mode === 'embedded-preview' && (
                <button
                  onClick={restartSlideshow}
                  className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Restart slideshow"
                >
                  <RotateCcw size={20} />
                </button>
              )}
              <button
                onClick={prevSlide}
                className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={isPlaying ? pauseSlideshow : startSlideshow}
                className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={nextSlide}
                className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <SkipForward size={20} />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSlide + 1) / slideshow.slide_urls.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Slide Thumbnails */}
        {/* Slide Thumbnails - Only show in view mode */}
        {mode === 'view' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Slides ({slideshow.slide_urls.length})
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {slideshow.slide_urls.map((url, index) => (
                <div
                  key={index}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden aspect-square ${
                    index === currentSlide ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setCurrentSlide(index)}
                >
                  {isImageBroken(index) ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageOff size={16} className="text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      onError={() => handleImageError(index)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden Audio Element */}
        {slideshow.audio_url && (
          <audio ref={audioRef} src={slideshow.audio_url} className="hidden" />
        )}
        
        {/* End Slideshow Modal */}
        {currentSlideshowData && mode === 'view' && (
          <EndSlideshowModal
            isOpen={showEndModal}
            onClose={handleCloseEndModal}
            onRestart={handleRestart}
            slideshowName={currentSlideshowData.name}
            slideshowMessage={currentSlideshowData.message}
            shareableLink={currentSlideshowData.link}
            slideshowId={slideshow?.id}
          />
        )}
      </div>
    </div>
  );
}