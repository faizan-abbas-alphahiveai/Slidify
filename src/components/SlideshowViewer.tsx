import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2, ImageOff, RotateCcw, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { supabase, type Slideshow, getRandomTagline, incrementSlideshowView, getPublicUrl } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import EndSlideshowModal from './EndSlideshowModal';
import ThemeToggle from './ThemeToggle';
import AuthModal from './AuthModal';

interface TransitionConfig {
  name: string;
  fullscreen: {
    initial: any;
    animate: any;
    exit: any;
  };
}

// const defaultTransition = {
//   duration:1,
//   ease: 'easeOut'
// };

// const slowTransition = {
//   duration: 4,
//   ease: 'easeOut'
// };

const easings = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],
  power: [0.77, 0, 0.175, 1],
  expo: [0.19, 1, 0.22, 1],
  circ: [0.075, 0.82, 0.165, 1],
  back: [0.175, 0.885, 0.32, 1.275]
};

interface TransitionConfig {
  name: string;
  fullscreen: {
    initial: any;
    animate: any;
    exit: any;
  };
}

// const defaultTransition = {
//   duration:1,
//   ease: 'easeOut'
// };

// const slowTransition = {
//   duration: 4,
//   ease: 'easeOut'
// };

// Standard timing configurations
const timing = {
  fast: { duration: 0.4 },
  normal: { duration: 0.7 },
  slow: { duration: 2.1 },
  verySlow: { duration: 2.5 },
  fadeslow: { duration: 2.7 },
  fadefast: { duration: 0.3 },
  revealslow: { duration: 2.9 },
};

export const transitionConfigs: Record<string, TransitionConfig> = {
  none: {
    name: 'None (Hard Cut)',
    fullscreen: {
      initial: {},
      animate: {},
      exit: {},
    },
  },

  // ========== FADE TRANSITIONS ==========
  fade: {
    name: 'Fade',
    fullscreen: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { ...timing.normal, ease: easings.smooth } },
      exit: { opacity: 0, transition: { ...timing.normal, ease: easings.smooth } },
    },
  },

  fadeSlow: {
    name: 'Fade (Slow)',
    fullscreen: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { ...timing.fadeslow, ease: easings.smooth } },
      exit: { opacity: 0, transition: { ...timing.fadeslow, ease: easings.smooth } },
    },
  },

  fadeFast: {
    name: 'Fade (Fast)',
    fullscreen: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { ...timing.fadefast, ease: easings.smooth } },
      exit: { opacity: 0, transition: { ...timing.fadefast, ease: easings.smooth } },
    },
  },

  fadeBlack: {
    name: 'Fade through Black',
    fullscreen: {
      initial: { opacity: 0, scale: 1.05, filter: 'brightness(0.8)' },
      animate: { 
        opacity: 1, 
        scale: 1, 
        filter: 'brightness(1)',
        transition: { ...timing.normal, ease: easings.power }
      },
      exit: { 
        opacity: 0, 
        scale: 0.95, 
        filter: 'brightness(0.8)',
        transition: { ...timing.normal, ease: easings.power }
      }
    }
  },

  scaleAdvanced: {
    name: 'Scale',
    fullscreen: {
      initial: { 
        opacity: 0, 
        scale: 0.2, 
        rotate: -15,
        filter: 'blur(8px) brightness(1.3)',
        transformOrigin: 'center center'
      },
      animate: { 
        opacity: 1, 
        scale: 1, 
        rotate: 0,
        filter: 'blur(0px) brightness(1)',
        transformOrigin: 'center center',
        transition: { 
          ...timing.slow, 
          ease: easings.elastic,
          scale: { duration: 1.2, ease: easings.back },
          rotate: { duration: 1.0, ease: easings.elastic },
          filter: { duration: 0.8, ease: easings.smooth }
        }
      },
      exit: { 
        opacity: 0, 
        scale: 2.5, 
        rotate: 15,
        filter: 'blur(6px) brightness(0.7)',
        transformOrigin: 'center center',
        transition: { 
          ...timing.normal, 
          ease: easings.expo,
          scale: { duration: 0.8, ease: easings.power },
          filter: { duration: 0.6, ease: easings.power }
        }
      }
    }
  },
  

 flipAdvanced: {
    name: 'Flip',
    fullscreen: {
      initial: {
        opacity: 0,
        rotateY: 180,
        scale: 0.8,
        transformPerspective: 1400,
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        filter: 'brightness(0.7) blur(2px)'
      },
      animate: {
        opacity: 1,
        rotateY: 0,
        scale: 1,
        transformPerspective: 1400,
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        filter: 'brightness(1) blur(0px)',
        transition: { 
          ...timing.slow, 
          ease: easings.back,
          rotateY: { duration: 1.0, ease: easings.elastic },
          scale: { duration: 0.8, ease: easings.back },
          filter: { duration: 0.6, ease: easings.smooth }
        }
      },
      exit: {
        opacity: 0,
        rotateY: -180,
        scale: 0.8,
        transformPerspective: 1400,
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        filter: 'brightness(0.7) blur(2px)',
        transition: { 
          ...timing.normal, 
          ease: easings.power,
          rotateY: { duration: 0.8, ease: easings.expo },
          scale: { duration: 0.6, ease: easings.power }
        }
      }
    }
  },

  // ========== SLIDE TRANSITIONS ==========
  slideLeft: {
    name: 'Slide Left',
    fullscreen: {
      initial: { x: '100%', opacity: 0 },
      animate: { 
        x: 0, 
        opacity: 1, 
        // transition: { ...timing.normal, ease: easings.expo }
      },
      exit: { 
        x: '-100%', 
        opacity: 0, 
        // transition: { ...timing.normal, ease: easings.expo }
      },
    },
  },

  slideRight: {
    name: 'Slide Right',
    fullscreen: {
      initial: { x: '-100%', opacity: 0 },
      animate: { 
        x: 0, 
        opacity: 1, 
        // transition: { ...timing.normal, ease: easings.expo }
      },
      exit: { 
        x: '100%', 
        opacity: 0, 
        // transition: { ...timing.normal, ease: easings.expo }
      },
    },
  },

  slideUp: {
    name: 'Slide Up',
    fullscreen: {
      initial: { y: '100%', opacity: 0 },
      animate: { 
        y: 0, 
        opacity: 1, 
        // transition: { ...timing.normal, ease: easings.expo }
      },
      exit: { 
        y: '-100%', 
        opacity: 0, 
        // transition: { ...timing.normal, ease: easings.expo }
      },
    },
  },

  slideDown: {
    name: 'Slide Down',
    fullscreen: {
      initial: { y: '-100%', opacity: 0 },
      animate: { 
        y: 0, 
        opacity: 1, 
        // transition: { ...timing.normal, ease: easings.expo }
      },
      exit: { 
        y: '100%', 
        opacity: 0, 
        // transition: { ...timing.normal, ease: easings.expo }
      },
    },
  },

  // ========== ZOOM/SCALE TRANSITIONS ==========
  zoom: {
    name: 'Zoom',
    fullscreen: {
      initial: { opacity: 0, scale: 0.3 },
      animate: { 
        opacity: 1, 
        scale: 1, 
        transition: { ...timing.normal, ease: easings.back }
      },
      exit: { 
        opacity: 0, 
        scale: 1.8, 
        transition: { ...timing.normal, ease: easings.power }
      }
    }
  },

  zoomIn: {
    name: 'Zoom In',
    fullscreen: {
      initial: { opacity: 0, scale: 0.5, filter: 'blur(4px)' },
      animate: { 
        opacity: 1, 
        scale: 1, 
        filter: 'blur(0px)',
        transition: { ...timing.normal, ease: easings.circ }
      },
      exit: { 
        opacity: 0, 
        scale: 0.8, 
        filter: 'blur(2px)',
        transition: { ...timing.fast, ease: easings.power }
      }
    }
  },

  zoomOut: {
    name: 'Zoom Out',
    fullscreen: {
      initial: { opacity: 0, scale: 1.5, filter: 'blur(4px)' },
      animate: { 
        opacity: 1, 
        scale: 1, 
        filter: 'blur(0px)',
        transition: { ...timing.normal, ease: easings.circ }
      },
      exit: { 
        opacity: 0, 
        scale: 1.2, 
        filter: 'blur(2px)',
        transition: { ...timing.fast, ease: easings.power }
      }
    }
  },

  // ========== 3D FLIP TRANSITIONS ==========
  flip: {
    name: 'Flip Horizontal',
    fullscreen: {
      initial: {
        opacity: 0,
        rotateY: 90,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d'
      },
      animate: {
        opacity: 1,
        rotateY: 0,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
        transition: { ...timing.normal, ease: easings.back }
      },
      exit: {
        opacity: 0,
        rotateY: -90,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
        transition: { ...timing.normal, ease: easings.power }
      }
    }
  },

  flipVertical: {
    name: 'Flip Vertical',
    fullscreen: {
      initial: {
        opacity: 0,
        rotateX: 90,
        transformPerspective: 1200,
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d'
      },
      animate: {
        opacity: 1,
        rotateX: 0,
        transformPerspective: 1200,
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        transition: { ...timing.normal, ease: easings.back }
      },
      exit: {
        opacity: 0,
        rotateX: -90,
        transformPerspective: 1200,
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        transition: { ...timing.normal, ease: easings.power }
      }
    }
  },

  // ========== ADVANCED POWERPOINT-STYLE TRANSITIONS ==========
  cube: {
    name: 'Cube',
    fullscreen: {
      initial: {
        opacity: 0,
        rotateY: 90,
        transformPerspective: 1000,
        transformOrigin: 'center right',
        transformStyle: 'preserve-3d'
      },
      animate: {
        opacity: 1,
        rotateY: 0,
        transformPerspective: 1000,
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
        transition: { ...timing.slow, ease: easings.expo }
      },
      exit: {
        opacity: 0,
        rotateY: -90,
        transformPerspective: 1000,
        transformOrigin: 'center left',
        transformStyle: 'preserve-3d',
        transition: { ...timing.slow, ease: easings.expo }
      }
    }
  },

  door: {
    name: 'Door',
    fullscreen: {
      initial: {
        opacity: 0,
        rotateY: -120,
        transformPerspective: 1200,
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d'
      },
      animate: {
        opacity: 1,
        rotateY: 0,
        transformPerspective: 1200,
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        transition: { ...timing.slow, ease: easings.elastic, delay: 1.6 }
      },
      exit: {
        opacity: 0,
        rotateY: 120,
        transformPerspective: 1200,
        transformOrigin: 'right center',
        transformStyle: 'preserve-3d',
        transition: { ...timing.slow, ease: easings.power }
      }
    }
  },

  ripple: {
    name: 'Ripple',
    fullscreen: {
      initial: { 
        opacity: 0, 
        scale: 0.8, 
        filter: 'blur(8px)',
        borderRadius: '50%'
      },
      animate: { 
        opacity: 1, 
        scale: 1, 
        filter: 'blur(0px)',
        borderRadius: '0%',
        transition: { 
          ...timing.slow, 
          ease: easings.elastic,
          borderRadius: { delay: 0.2, duration: 0.8 }
        }
      },
      exit: { 
        opacity: 0, 
        scale: 1.2, 
        filter: 'blur(4px)',
        transition: { ...timing.fast, ease: easings.power }
      }
    }
  },

  spiral: {
    name: 'Spiral',
    fullscreen: {
      initial: {
        opacity: 0,
        scale: 0.3,
        rotate: -180,
        transformPerspective: 1000
      },
      animate: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transformPerspective: 1000,
        transition: { ...timing.slow, ease: easings.back }
      },
      exit: {
        opacity: 0,
        scale: 0.3,
        rotate: 180,
        transformPerspective: 1000,
        transition: { ...timing.normal, ease: easings.power }
      }
    }
  },

  morph: {
    name: 'Morph',
    fullscreen: {
      initial: {
        opacity: 0,
        scale: 0.6,
        skewX: 20,
        skewY: 5,
        filter: 'hue-rotate(90deg) blur(3px)'
      },
      animate: {
        opacity: 1,
        scale: 1,
        skewX: 0,
        skewY: 0,
        filter: 'hue-rotate(0deg) blur(0px)',
        transition: { ...timing.slow, ease: easings.elastic}
        
      },
      exit: {
        opacity: 0,
        scale: 0.6,
        skewX: -20,
        skewY: -5,
        filter: 'hue-rotate(-90deg) blur(3px)',
        transition: { ...timing.normal, ease: easings.power, delay:1.1 }
      }
    }
  },

  // ========== CLASSIC POWERPOINT EFFECTS ==========
  wipe: {
    name: 'Wipe',
    fullscreen: {
      initial: { 
        clipPath: 'inset(0 100% 0 0)',
        opacity: 1
      },
      animate: { 
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        transition: { ...timing.normal, ease: easings.power }
      },
      exit: { 
        clipPath: 'inset(0 0% 0 100%)',
        opacity: 1,
        transition: { ...timing.normal, ease: easings.power }
      },
    },
  },

  //Wipe Down

  wipeDown: {
  name: 'Wipe Down',
  fullscreen: {
    initial: { 
      clipPath: 'inset(0 0 100% 0)',
      opacity: 1
    },
    animate: { 
      clipPath: 'inset(0% 0 0 0)',
      opacity: 1,
      transition: { ...timing.normal, ease: easings.power }
    },
    exit: { 
      clipPath: 'inset(100% 0 0 0)',
      opacity: 1,
      transition: { ...timing.normal, ease: easings.power }
    },
  },
  },

  blinds: {
  name: 'Blinds',
  fullscreen: {
    initial: { 
      scaleY: 0,
      opacity: 1,
      transformOrigin: 'center',
      filter: 'contrast(1.2)'
    },
    animate: { 
      scaleY: 1,
      opacity: 1,
      transformOrigin: 'center',
      filter: 'contrast(1)',
      transition: { ...timing.normal, ease: easings.power }
    },
    exit: { 
      scaleY: 0,
      opacity: 1,
      transformOrigin: 'center',
      filter: 'contrast(1.2)',
      transition: { ...timing.normal, ease: easings.power }
    },
  },
  },

  reveal: {
  name: 'Reveal',
  fullscreen: {
    initial: { 
      opacity: 0, 
      scale: 1.2,
      filter: 'brightness(200)'
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      filter: 'brightness(1)',
      transition: { 
        ...timing.normal, 
        ease: easings.circ,
        opacity: { duration: timing.revealslow.duration * 0.4 },
        filter: { duration: timing.revealslow.duration * 0.6 },
        scale: { duration: timing.revealslow.duration, ease: "easeOut" }
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.1,
      filter: 'brightness(1.5)',
      transition: { 
        ...timing.revealslow, 
        ease: easings.power
      }
    },
  },
  },

  // ========== COVER/UNCOVER EFFECTS ==========
  cover: {
  name: 'Cover',
  fullscreen: {
    initial: { 
      x: '100%', 
      opacity: 1,
      boxShadow: '-20px 0 40px rgba(0,0,0,0.3)'
    },
    animate: { 
      x: 0, 
      opacity: 1,
      boxShadow: '0px 0 40px rgba(0,0,0,0.1)',
      transition: { ...timing.normal, ease: easings.expo }
    },
    exit: { 
      x: '-100%', 
      opacity: 1,
      boxShadow: '20px 0 40px rgba(0,0,0,0.3)',
      transition: { ...timing.normal, ease: easings.power }
    },
  },
  },

  uncover: {
  name: 'Uncover',
  fullscreen: {
    initial: { 
      x: 0, 
      opacity: 1,
      boxShadow: '0px 0 40px rgba(0,0,0,0.1)',
      zIndex: 0
    },
    animate: { 
      x: 0, 
      opacity: 1,
      boxShadow: '0px 0 40px rgba(0,0,0,0.1)',
      zIndex: 1,
      transition: { ...timing.normal, ease: easings.expo }
    },
    exit: { 
      x: '100%', 
      opacity: 1,
      boxShadow: '-20px 0 40px rgba(0,0,0,0.3)',
      zIndex: 10,
      transition: { ...timing.normal, ease: easings.power }
    },
  },
  },
};


interface SlideImageProps {
  slideshow: Slideshow;
  currentSlide: number;
  transitionConfig: TransitionConfig;
  handleImageError: (slideIndex: number) => void;
}

function SlideImage({ slideshow, currentSlide, transitionConfig, handleImageError }: SlideImageProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const isImageBroken = (slideIndex: number) => {
    return imageErrors.has(slideIndex);
  };

  const handleError = (slideIndex: number) => {
    setImageErrors(prev => new Set(prev).add(slideIndex));
    handleImageError(slideIndex);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Preload next image */}
      <img className="object-cover"
        src={slideshow.slide_urls[(currentSlide + 1) % slideshow.slide_urls.length]} 
        alt="" 
        style={{ display: 'none' }} 
      />
      
      {isImageBroken(currentSlide) ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center text-gray-800 dark:text-white">
            <ImageOff size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Image not available</p>
            <p className="text-sm opacity-70">Slide {currentSlide + 1}</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="sync">
          <motion.img
            key={`${slideshow.id}-${currentSlide}`}
            src={slideshow.slide_urls[currentSlide]}
            alt={`Slide ${currentSlide + 1}`}
            className="absolute inset-0 w-full h-full object-contain select-none"
            style={{ position: 'absolute', top: 0, left: 0 }}
            initial={transitionConfig.fullscreen.initial}
            animate={transitionConfig.fullscreen.animate}
            exit={transitionConfig.fullscreen.exit}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onError={() => handleError(currentSlide)}
          />
        </AnimatePresence>
      )}
    </div>
  );
}

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
  const [showControls, setShowControls] = useState(true);
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track dark mode state for Lottie animation
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode and set up listener
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Use different Lottie animations based on theme
  const lottieAnimationUrl = isDarkMode 
    ? 'https://qycqsyfqipsmlyqydvso.supabase.co/storage/v1/object/public/lottie-animations//Slidifydarkmode.json'
    : 'https://qycqsyfqipsmlyqydvso.supabase.co/storage/v1/object/public/lottie-animations//Slidifylightmode.json';

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

  // const startSlideshow = () => {
  //   if (!slideshow || slideshow.slide_urls.length === 0) return;
    
  //   setShowIntroOverlay(false);
  //   setIsPlaying(true);
    
  //   // Track slideshow view (only for saved slideshows, not previews)
  //   if (slideshowId && slideshowId !== 'temp' && mode === 'view') {
  //     incrementSlideshowView(slideshowId);
  //   }
    
  //   // Start audio playback with a slight delay to ensure audio element is ready
  //   setTimeout(() => {
  //     if (audioRef.current && slideshow.audio_url) {
  //       audioRef.current.currentTime = 0; // Reset to beginning
  //       audioRef.current.play().catch(error => {
  //         console.error('Audio playback failed:', error);
  //       });
  //     }
  //   }, 100);
    
  //   // Function to get slide duration based on slide index
  //   const getSlideDuration = (slideIndex: number) => {
  //     const isFirstSlide = slideIndex === 0;
  //     const isLastSlide = slideIndex === slideshow.slide_urls.length - 1;
      
  //     if (isFirstSlide || isLastSlide) {
  //       return (slideshow.slide_duration + 1.5) * 1000; // Add 1.5 seconds
  //     }
  //     return slideshow.slide_duration * 1000;
  //   };
    
  //   // Start with first slide duration (extended)
  //   const scheduleNextSlide = (currentIndex: number) => {
  //     const duration = getSlideDuration(currentIndex);
      
  //     slideIntervalRef.current = setTimeout(() => {
  //       setCurrentSlide(prev => {
  //         const nextSlide = (prev + 1) % slideshow.slide_urls.length;
  //         // Check if we've completed a full cycle
  //         if (nextSlide === 0 && prev === slideshow.slide_urls.length - 1) {
  //           // Stop slideshow but keep audio playing
  //           setIsPlaying(false);
  //           if (slideIntervalRef.current) {
  //             clearTimeout(slideIntervalRef.current);
  //           }
  //           // Set current slideshow data for end modal
  //           setCurrentSlideshowData({
  //             name: slideshow.name,
  //             message: slideshow.message || '',
  //             link: window.location.href
  //           });
  //           setShowEndModal(true);
  //           return prev; // Don't advance to next slide
  //         }
          
  //         // Schedule the next slide transition
  //         scheduleNextSlide(nextSlide);
  //         return nextSlide;
  //       });
  //     }, duration);
  //   };
    
  //   // Start the scheduling with the first slide (index 0)
  //   scheduleNextSlide(0);
  // };


  // New
  const startSlideshow = () => {
    if (!slideshow || slideshow.slide_urls.length === 0) return;
    
    setShowIntroOverlay(false);
    setIsPlaying(true);
    
    // Track slideshow view (only for saved slideshows, not previews)
    if (slideshowId && slideshowId !== 'temp' && mode === 'view') {
      incrementSlideshowView(slideshowId);
    }
    
    // Clear any existing interval to prevent multiple timers
    if (slideIntervalRef.current) {
      clearTimeout(slideIntervalRef.current);
      slideIntervalRef.current = null;
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
    
    // Recursive function to schedule the next slide
    const scheduleNextSlide = (currentIndex: number) => {
      // Clear any existing timeout
      if (slideIntervalRef.current) {
        clearTimeout(slideIntervalRef.current);
      }
      
      const duration = getSlideDuration(currentIndex);
      
      slideIntervalRef.current = setTimeout(() => {
        // Check if slideshow is still playing before advancing
        setIsPlaying(prev => {
          if (!prev) return prev; // Don't advance if paused
          
          setCurrentSlide(currentSlideIndex => {
            const nextSlide = (currentSlideIndex + 1) % slideshow.slide_urls.length;
            
            // Check if we've completed a full cycle
            if (nextSlide === 0 && currentSlideIndex === slideshow.slide_urls.length - 1) {
              // Stop slideshow but keep audio playing
              setIsPlaying(false);
              if (slideIntervalRef.current) {
                clearTimeout(slideIntervalRef.current);
                slideIntervalRef.current = null;
              }
              // Set current slideshow data for end modal
              setCurrentSlideshowData({
                name: slideshow.name,
                message: slideshow.message || '',
                link: window.location.href
              });
              setShowEndModal(true);
              return currentSlideIndex; // Don't advance to next slide
            }
            
            // Schedule the next slide transition only if still playing
            setTimeout(() => {
              scheduleNextSlide(nextSlide);
            }, 50); // Small delay to ensure state updates
            
            return nextSlide;
          });
          
          return prev;
        });
      }, duration);
    };
    
    // Start the scheduling with the current slide
    scheduleNextSlide(currentSlide);
  };


  // const pauseSlideshow = () => {
  //   setIsPlaying(false);
  //   if (audioRef.current) {
  //     audioRef.current.pause();
  //   }
  //   if (slideIntervalRef.current) {
  //     clearTimeout(slideIntervalRef.current);
  //   }
  // };


  //  New
  const pauseSlideshow = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (slideIntervalRef.current) {
      clearTimeout(slideIntervalRef.current);
      slideIntervalRef.current = null;
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

  // New
  const restartSlideshow = () => {
    if (!slideshow) return;
    
    // Stop current playback and clear timers
    pauseSlideshow();
    
    // Reset to first slide
    setCurrentSlide(0);
    
    // Reset audio to beginning
    if (audioRef.current && slideshow.audio_url) {
      audioRef.current.currentTime = 0;
    }
    
    // Start slideshow from beginning after a short delay
    setTimeout(() => {
      startSlideshow();
    }, 100);
  };


  // const restartSlideshow = () => {
  //   if (!slideshow) return;
    
  //   // Stop current playback
  //   pauseSlideshow();
    
  //   // Reset to first slide
  //   setCurrentSlide(0);
    
  //   // Reset audio to beginning
  //   if (audioRef.current && slideshow.audio_url) {
  //     audioRef.current.currentTime = 0;
  //   }
    
  //   // Start slideshow from beginning
  //   setTimeout(() => {
  //     startSlideshow();
  //   }, 100);
  // };

  // New
  useEffect(() => {
  if (initialSlideshow) {
    setSlideshow(initialSlideshow as Slideshow);
    setIsLoading(false);
  } else if (slideshowId && slideshowId !== 'temp') {
    loadSlideshow();
  }
  
  // Cleanup function New
  return () => {
    if (slideIntervalRef.current) {
      clearTimeout(slideIntervalRef.current);
      slideIntervalRef.current = null;
    }
    };
  }, [slideshowId, initialSlideshow]);

  // New
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (slideIntervalRef.current) {
        clearTimeout(slideIntervalRef.current);
        slideIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Idle timer for hiding controls
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      
      setShowControls(true);
      
      const newTimer = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds of inactivity
      
      setIdleTimer(newTimer);
    };

    // Start the initial timer
    resetIdleTimer();

    return () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
    };
  }, []);

  const handleMouseMove = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    
    setShowControls(true);
    
    const newTimer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setIdleTimer(newTimer);
  };

  const handleMouseLeave = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    setShowControls(false);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading slideshow...</p>
        </div>
      </div>
    );
  }

  if (error || !slideshow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Slideshow Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested slideshow could not be found.'}</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                </h1>
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
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
                className="group relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 hover:scale-105"
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
              <SlideImage
                slideshow={slideshow}
                currentSlide={currentSlide}
                transitionConfig={transitionConfig}
                handleImageError={handleImageError}
              />
              <div 
                className="absolute inset-0"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
              <div className={`absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-black/70 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}>
                <button
                  onClick={prevSlide}
                  className="p-2 sm:p-2 text-white hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                >
                  <SkipBack size={18} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={isPlaying ? pauseSlideshow : startSlideshow}
                  className="p-3 sm:p-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all touch-manipulation"
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
              <div className={`absolute top-4 sm:top-6 right-4 sm:right-6 text-gray-800 dark:text-white bg-white/80 dark:bg-black/70 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}>
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

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
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
          <SlideImage
            slideshow={slideshow}
            currentSlide={currentSlide}
            transitionConfig={transitionConfig}
            handleImageError={handleImageError}
          />
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
              className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
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
              className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
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
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Slidify.app</h1>
              
              <div className="flex justify-center">
                {user ? (
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {getDisplayName()}
                    </span>
                    <button
                      onClick={signOut}
                      className="p-2 text-blue-600 hover:text-cyan-600 dark:text-blue-400 dark:hover:text-cyan-400 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2 text-sm"
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </button>
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
            <SlideImage
              slideshow={slideshow}
              currentSlide={currentSlide}
              transitionConfig={transitionConfig}
              handleImageError={handleImageError}
            />
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
                className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
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
                className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSlide + 1) / slideshow.slide_urls.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

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
                    index === currentSlide ? 'ring-2 ring-blue-500' : ''
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
                      className="w-full h-full object-contain transition-transform group-hover:scale-110 bg-gray-100 dark:bg-gray-600"
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

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
          />
        )}
      </div>
    </div>
  );
}