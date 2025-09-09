import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Upload, Music, Play, Pause, SkipBack, SkipForward, Save, Share2, Settings, User, LogOut, Trash2, Eye, X, Clock, Crown } from 'lucide-react';
import { supabase, getPublicUrl, getRandomTagline } from './lib/supabase';
import { useAuth } from './lib/auth';
import { useSubscription } from './lib/subscription';
import AuthModal from './components/AuthModal';
import SuccessModal from './components/SuccessModal';
import MusicSelector from './components/MusicSelector';
import SlideshowViewer from './components/SlideshowViewer';
import EndSlideshowModal from './components/EndSlideshowModal';
import ThemeToggle from './components/ThemeToggle';
import UserSettings from './components/UserSettings';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import UpgradeModal from './components/UpgradeModal';

interface Slideshow {
  id: string;
  name: string;
  audio_url: string | null;
  slide_urls: string[];
  slide_duration: number;
  transition_type: string;
  message: string;
  created_at: string;
}

interface Music {
  id: string;
  song_title: string;
  audio_url: string;
  duration: number;
}

export default function App() {
  const { user, getDisplayName, signOut, refreshUserProfile } = useAuth();
  const { isPremium, isLoading: subscriptionLoading, productName } = useSubscription();
  const [images, setImages] = useState<File[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [slideDuration, setSlideDuration] = useState(3);
  const [transitionType, setTransitionType] = useState('fade');
  const [slideshowName, setSlideshowName] = useState('');
  const [message, setMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSlideshowViewer, setShowSlideshowViewer] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [currentSlideshow, setCurrentSlideshow] = useState<Slideshow | null>(null);
  const [userSlideshows, setUserSlideshows] = useState<Slideshow[]>([]);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [slideshowToDelete, setSlideshowToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPreviewingMusic, setIsPreviewingMusic] = useState(false);
  const [musicPreviewRef, setMusicPreviewRef] = useState<HTMLAudioElement | null>(null);
  const [tagline, setTagline] = useState('Create beautiful slideshows with a few simple clicks');

  const lottieAnimationUrl = getPublicUrl('lottie-animations', 'Slide.Animation.json');

  // Check for payment success/cancel in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Clear URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      // Show success message or redirect
      alert('Welcome to Slidify Premium! Your subscription is now active.');
    } else if (paymentStatus === 'cancelled') {
      // Clear URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Set default values for unauthenticated users
  useEffect(() => {
    if (!user && slideshowName === '' && message === '') {
      // Only set defaults if fields are empty
      setSlideshowName('My first slideshow on slidify.app');
      setMessage('Trying out this new tool for creating and sharing virtual slideshows - slidify.app');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserSlideshows();
    }
  }, [user]);

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

  const handleUserSettingsClose = () => {
    setShowUserSettings(false);
    // Refresh user profile to reflect any changes
    if (refreshUserProfile) {
      refreshUserProfile();
    }
  };
  const fetchUserSlideshows = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('slideshows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching slideshows:', error);
    } else {
      setUserSlideshows(data || []);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...imageFiles]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove the dragged image from its original position
    newImages.splice(draggedIndex, 1);
    
    // Insert it at the new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    setImages(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const toggleMusicPreview = () => {
    if (!selectedMusic) return;

    if (isPreviewingMusic) {
      // Stop preview
      if (musicPreviewRef) {
        musicPreviewRef.pause();
        musicPreviewRef.currentTime = 0;
      }
      setIsPreviewingMusic(false);
    } else {
      // Start preview
      if (musicPreviewRef) {
        musicPreviewRef.src = selectedMusic.audio_url;
        musicPreviewRef.currentTime = 0;
        musicPreviewRef.play().catch(error => {
          console.error('Music preview failed:', error);
        });
      } else {
        // Create audio element if it doesn't exist
        const audio = new Audio(selectedMusic.audio_url);
        audio.volume = 0.5;
        audio.onended = () => setIsPreviewingMusic(false);
        audio.play().catch(error => {
          console.error('Music preview failed:', error);
        });
        setMusicPreviewRef(audio);
      }
      setIsPreviewingMusic(true);
    }
  };

  // Set up audio element event listeners
  React.useEffect(() => {
    if (musicPreviewRef) {
      const handleEnded = () => setIsPreviewingMusic(false);
      musicPreviewRef.addEventListener('ended', handleEnded);
      return () => musicPreviewRef.removeEventListener('ended', handleEnded);
    }
  }, [musicPreviewRef]);

  const uploadImages = async (imageFiles: File[]): Promise<string[]> => {
    const uploadPromises = imageFiles.map(async (file) => {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('slideshow-images')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }

      return getPublicUrl('slideshow-images', fileName);
    });

    return Promise.all(uploadPromises);
  };

  const createShareableLink = async () => {
    if (images.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    if (!slideshowName.trim()) {
      alert('Please enter a slideshow name');
      return;
    }

    // Check image limit for non-premium users
    if (!isPremium && images.length > 10) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const slideUrls = await uploadImages(images);
      
      const slideshowData = {
        name: slideshowName,
        audio_url: selectedMusic?.audio_url || null,
        slide_urls: slideUrls,
        slide_duration: slideDuration,
        transition_type: (transitionType ?? '') || '',
        message: message,
        user_id: user?.id || null,
      };

      const { data, error } = await supabase
        .from('slideshows')
        .insert([slideshowData])
        .select()
        .single();

      if (error) {
        console.error('Error saving slideshow:', error);
        alert('Error saving slideshow');
        return;
      }

      const url = `${window.location.origin}?slideshow=${data.id}`;
      setShareUrl(url);
      setShowSuccessModal(true);
      
      if (user) {
        fetchUserSlideshows();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating shareable link');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSlideshow = async (id: string) => {
    const slideshow = userSlideshows.find(s => s.id === id);
    if (!slideshow) return;
    
    setSlideshowToDelete({ id, name: slideshow.name });
    setShowDeleteConfirmationModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!slideshowToDelete) return;

    const { error } = await supabase
      .from('slideshows')
      .delete()
      .eq('id', slideshowToDelete.id);

    if (error) {
      console.error('Error deleting slideshow:', error);
      alert('Error deleting slideshow');
    } else {
      fetchUserSlideshows();
    }
    
    // Reset modal state
    setShowDeleteConfirmationModal(false);
    setSlideshowToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmationModal(false);
    setSlideshowToDelete(null);
  };

  const viewSlideshow = (slideshow: Slideshow) => {
    setCurrentSlideshow(slideshow);
    setShowSlideshowViewer(true);
  };

  const handleSlideshowEnd = () => {
    setShowSlideshowViewer(false);
    setShowEndModal(true);
  };

  // Check for shared slideshow on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const slideshowId = urlParams.get('slideshow');
    
    if (slideshowId) {
      fetchSharedSlideshow(slideshowId);
    }
  }, []);

  const fetchSharedSlideshow = async (id: string) => {
    const { data, error } = await supabase
      .from('slideshows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching shared slideshow:', error);
    } else {
      setCurrentSlideshow(data);
      setShowSlideshowViewer(true);
    }
  };

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
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">{tagline}</p>
              
              <div className="flex justify-center">
                {user ? (
                  <div className="flex items-center gap-2">
                    {isPremium && !subscriptionLoading && (
                      <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-2 py-1 rounded-full">
                        <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{productName || 'Premium'}</span>
                      </div>
                    )}
                    <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <button
                      onClick={() => setShowUserSettings(true)}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {getDisplayName()}
                    </button>
                    {!isPremium && !subscriptionLoading && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all"
                      >
                        Upgrade
                      </button>
                    )}
                    <button
                      onClick={signOut}
                      className="p-2 text-purple-600 hover:text-pink-600 dark:text-purple-400 dark:hover:text-pink-400 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 text-sm"
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
        {/* Upload Images */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-purple-600" />
            Images
            {!isPremium && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                (Max 10 for free users)
              </span>
            )}
          </h2> 
              
          {images.length === 0 ? (
            <div
              className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300">Drag and drop images here, or click to select</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative group cursor-move ${
                      draggedIndex === index ? 'dragging' : ''
                    } ${
                      dragOverIndex === index ? 'drag-over' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleImageDragStart(e, index)}
                    onDragOver={(e) => handleImageDragOver(e, index)}
                    onDragLeave={handleImageDragLeave}
                    onDrop={(e) => handleImageDrop(e, index)}
                    onDragEnd={handleImageDragEnd}
                  >
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg select-none"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      ×
                    </button>
                    {/* Drag indicator */}
                    <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {index + 1}
                    </div>
                  </div>
                ))}
                {/* Add more images button */}
                {(isPremium || images.length < 10) && (
                  <div className="relative group">
                    <div
                      className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
                      tabIndex={0}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => document.getElementById('add-more-images')?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          document.getElementById('add-more-images')?.click();
                        }
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="add-more-images"
                      />
                      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs">Add more</span>
                      </div>
                    </div>
                  </div>
                )}
                {!isPremium && images.length >= 10 && (
                  <div className="relative group">
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full h-24 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg flex flex-col items-center justify-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer bg-purple-50 dark:bg-purple-900/20"
                    >
                      <Crown className="w-6 h-6 mb-1 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Upgrade for more</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Background Music */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Music className="w-6 h-6 text-purple-600" />
            Background Music
            {!isPremium && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                (Limited selection for free users)
              </span>
            )}
          </h2>
          
          {selectedMusic ? (
            <div 
              className="group flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              onClick={() => setShowMusicSelector(true)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 dark:text-white truncate flex-1">{selectedMusic.song_title}</h3>
                <Clock size={14} className="text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {Math.floor(selectedMusic.duration / 60)}:{(selectedMusic.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMusicPreview();
                }}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
                title={isPreviewingMusic ? 'Stop preview' : 'Preview music'}
              >
                {isPreviewingMusic ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMusic(null);
                }}
                className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove music"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowMusicSelector(true)}
              className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
            >
              <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300">Choose background music (optional)</p>
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-600" />
            Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slideshow Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={slideshowName}
                  onChange={(e) => setSlideshowName(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter slideshow name"
                />
                {slideshowName && (
                  <button
                    type="button"
                    onClick={() => setSlideshowName('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Clear slideshow name"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Add a message to your slideshow"
                />
                {message && (
                  <button
                    type="button"
                    onClick={() => setMessage('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Clear message"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slide Duration: {slideDuration}s
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={slideDuration}
                onChange={(e) => setSlideDuration(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transition Effect
              </label>
              <select
                value={transitionType || ''}
                onChange={(e) => setTransitionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="none">None (Hard Cut)</option>
                <option value="fade">Fade</option>
                <option value="fadeSlow">Fade (Slow)</option>
                <option value="fadeFast">Fade (Fast)</option>
                <option value="fadeBlack">Fade through black</option>
                <option value="fadeBlackFast">Fade through black (Fast)</option>
                <option value="slide">Slide</option>
                <option value="slideLeft">Slide Left</option>
                <option value="slideRight">Slide Right</option>
                <option value="slideUp">Slide Up</option>
                <option value="slideDown">Slide Down</option>
                <option value="scale">Scale</option>
                <option value="flip">Flip</option>
                <option value="zoom">Zoom</option>
                <option value="cover">Cover</option>
                <option value="uncover">Uncover</option>
                <option value="reveal">Reveal</option>
              </select>
            </div>

          </div>
        </div>

        {/* Preview */}
        {images.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-purple-600" />
              Preview
            </h2>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <SlideshowViewer
                slideshowId="temp"
                mode="embedded-preview"
                initialSlideshow={{
                  id: 'preview-slideshow',
                  name: slideshowName || 'Preview',
                  message: message,
                  slide_urls: images.map(img => URL.createObjectURL(img)),
                  audio_url: selectedMusic?.audio_url || null,
                  slide_duration: slideDuration,
                  transition_type: transitionType,
                  user_id: '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }}
              />
            </div>
          </div>
        )}

        {/* Create Shareable Link */}
        <button
          onClick={createShareableLink}
          disabled={isLoading || images.length === 0 || !slideshowName.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg font-semibold shadow-lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Link...
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              Save and Share
            </>
          )}
        </button>

        {/* Your Slideshows */}
        {user && userSlideshows.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">My Slideshows</h2>
            <div className="space-y-3">
              {userSlideshows.map((slideshow) => (
                <div key={slideshow.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white">{slideshow.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {slideshow.slide_urls.length} slides • Created {new Date(slideshow.created_at).toLocaleDateString()} at {new Date(slideshow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}?view=${slideshow.id}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                      title="View slideshow"
                    >
                      <Eye className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}?view=${slideshow.id}`;
                        navigator.clipboard.writeText(url);
                        alert('Share link copied to clipboard!');
                      }}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                      title="Copy share link"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => deleteSlideshow(slideshow.id)}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                      title="Delete slideshow"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      {showUserSettings && (
        <UserSettings
          isOpen={showUserSettings}
          onClose={handleUserSettingsClose}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          slideshowName={slideshowName}
          shareableLink={shareUrl}
        />
      )}

      {showMusicSelector && (
        <MusicSelector
          isOpen={showMusicSelector}
          onClose={() => setShowMusicSelector(false)}
          onSelectMusic={setSelectedMusic}
        />
      )}

      {showSlideshowViewer && currentSlideshow && (
        <SlideshowViewer
          slideshowId={currentSlideshow.id}
          initialSlideshow={currentSlideshow}
          onClose={() => setShowSlideshowViewer(false)}
          onEnd={handleSlideshowEnd}
        />
      )}

      {showEndModal && (
        <EndSlideshowModal onClose={() => setShowEndModal(false)} />
      )}

      {showDeleteConfirmationModal && slideshowToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmationModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          slideshowName={slideshowToDelete.name}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}









