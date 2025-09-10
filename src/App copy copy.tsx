import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";
import {
  Upload,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Save,
  Share2,
  Settings,
  User,
  LogOut,
  Trash2,
  Eye,
  X,
  Clock,
  Crown,
  MessageSquare,
  Edit,
  Copy,
  Check,
  Dices,
  Gem,
  Users,
  ExternalLink,
  Plus,
  Minus,
} from "lucide-react";
import {
  supabase,
  getPublicUrl,
  getRandomTagline,
  getRandomSlideshowNameMessage,
  getSubscriptionMessage,
  getUserSubscriptionMessages,
  createSubscriptionMessage,
  updateSubscriptionMessage,
  deleteSubscriptionMessage,
} from "./lib/supabase";
import { useAuth } from "./lib/auth";
import { useSubscription } from "./lib/subscription";
import AuthModal from "./components/AuthModal";
import SuccessModal from "./components/SuccessModal";
import MusicSelector from "./components/MusicSelector";
import SlideshowViewer from "./components/SlideshowViewer";
import EndSlideshowModal from "./components/EndSlideshowModal";
import ThemeToggle from "./components/ThemeToggle";
import UserSettings from "./components/UserSettings";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import UpgradeModal from "./components/UpgradeModal";
import FeedbackModal from "./components/FeedbackModal";
import CollaborativeUploadModal from "./components/CollaborativeUploadModal";
import ConversionModal from "./components/ConversionModal";

// Icon mapping for dynamic icon rendering within messages
const iconMap = {
  Crown,
  Users,
  Music,
  Upload,
  // Add any other Lucide icons you might want to use in messages
};

// Helper function to parse markdown within a string and return React nodes
const parseTextWithMarkdown = (text: string, keyPrefix: string) => {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  // Combined regex for all markdown patterns
  // Order of alternatives matters for correct parsing (e.g., `code` before `bold`)
  const markdownRegex = /(\[([^\]]+?)\]\((https?:\/\/[^\s]+?)\))|(`([^`]+?)`)|(~~(.*?)~~)|(__(.+?)__)|(\*\*(.*?)\*\*)|(\*(.*?)\*)/g;

  let match;
  while ((match = markdownRegex.exec(text)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    // Determine which pattern matched
    const fullMatch = match[0];
    const linkText = match[2];
    const linkUrl = match[3];
    const codeText = match[5];
    const strikeText = match[7];
    const underlineText = match[9];
    const boldText = match[11];
    const italicText = match[13];

    if (linkText && linkUrl) {
      // Link
      elements.push(
        <a
          key={`${keyPrefix}-link-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <span>{linkText}</span>
          <ExternalLink size={12} className="inline-block ml-0.5" />
        </a>
      );
    } else if (codeText) {
      // Code
      elements.push(
        <code key={`${keyPrefix}-code-${match.index}`} className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">
          {codeText}
        </code>
      );
    } else if (strikeText) {
      // Strikethrough
      elements.push(
        <span key={`${keyPrefix}-strike-${match.index}`} className="line-through">
          {strikeText}
        </span>
      );
    } else if (underlineText) {
      // Underline
      elements.push(
        <span key={`${keyPrefix}-underline-${match.index}`} className="underline">
          {underlineText}
        </span>
      );
    } else if (boldText) {
      // Bold
      elements.push(
        <strong key={`${keyPrefix}-bold-${match.index}`}>
          {boldText}
        </strong>
      );
    } else if (italicText) {
      // Italic
      elements.push(
        <em key={`${keyPrefix}-italic-${match.index}`}>
          {italicText}
        </em>
      );
    }

    lastIndex = markdownRegex.lastIndex;
  }

  // Add any remaining plain text
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements;
};

// Main parsing function for icons and markdown
const parseFormattedMessage = (message: string) => {
  const result: React.ReactNode[] = [];
  // Split by icon pattern, keeping the delimiters
  const parts = message.split(/(\[icon:[^\]]+?(?::[^\]]+?)?\])/g);

  parts.forEach((part, index) => {
    if (part.startsWith('[icon:') && part.endsWith(']')) {
      // Icon parsing logic
      const match = part.match(/\[icon:([^\]]+?)(?::([^\]]+?))?\]/);
      if (match) {
        const iconName = match[1];
        const colorClass = match[2] || 'text-blue-600';
        const IconComponent = iconMap[iconName as keyof typeof iconMap];
        if (IconComponent) {
          result.push(
            <IconComponent key={`icon-${index}`} size={16} className={`inline-block align-middle mr-1 ${colorClass}`} />
          );
        }
      } else {
        // Fallback for malformed icon syntax
        result.push(<span key={`malformed-icon-${index}`}>{part}</span>);
      }
    } else {
      // Parse markdown for non-icon parts
      result.push(...parseTextWithMarkdown(part, `text-part-${index}`));
    }
  });

  return result;
};

// Function to parse the message and insert icons
const parseMessageWithIcons = (message: string) => {
  if (!message) return null;
  
  const parts = message.split(/(\[icon:[^\]]+\])/);
  return parts.map((part, index) => {
    if (part.startsWith('[icon:') && part.endsWith(']')) {
      const iconName = part.substring(6, part.length - 1); // Extract icon name
      const IconComponent = iconMap[iconName as keyof typeof iconMap];
      if (IconComponent) {
        return <IconComponent key={index} size={16} className="inline-block mx-1 align-middle" />;
      }
    }
    return part;
  });
};

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
  const {
    isPremium,
    isLoading: subscriptionLoading,
    productName,
  } = useSubscription();
  const [images, setImages] = useState<(File | string)[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [slideDuration, setSlideDuration] = useState(4);
  const [transitionType, setTransitionType] = useState("fade");
  const [slideshowName, setSlideshowName] = useState("");
  const [message, setMessage] = useState("");
  const [editingSlideshowId, setEditingSlideshowId] = useState<string | null>(
    null
  );
  const [copiedSlideshowId, setCopiedSlideshowId] = useState<string | null>(
    null
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSlideshowViewer, setShowSlideshowViewer] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [currentSlideshow, setCurrentSlideshow] = useState<Slideshow | null>(
    null
  );
  const [userSlideshows, setUserSlideshows] = useState<Slideshow[]>([]);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] =
    useState(false);
  const [slideshowToDelete, setSlideshowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [imagesSubscriptionMessage, setImagesSubscriptionMessage] = useState<string | null>(null);
  const [musicSubscriptionMessage, setMusicSubscriptionMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [imageSectionSubscriptionMessage, setImageSectionSubscriptionMessage] = useState<string | null>(null);
  const [musicSectionSubscriptionMessage, setMusicSectionSubscriptionMessage] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPreviewingMusic, setIsPreviewingMusic] = useState(false);
  const [musicPreviewRef, setMusicPreviewRef] =
    useState<HTMLAudioElement | null>(null);
  const [tagline, setTagline] = useState(
    "Create beautiful slideshows with a few simple clicks"
  );
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [showCollaborativeUploadModal, setShowCollaborativeUploadModal] =
    useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [shouldOpenCollaborativeUpload, setShouldOpenCollaborativeUpload] =
    useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string>('');
  const [userSubscriptionMessages, setUserSubscriptionMessages] = useState<any[]>([]);
  const [newSubscriptionMessage, setNewSubscriptionMessage] = useState('');
  const [newSubscriptionType, setNewSubscriptionType] = useState('unauthenticated');
  const [newSubscriptionLocation, setNewSubscriptionLocation] = useState('images_section');
  const [editingSubscriptionMessageId, setEditingSubscriptionMessageId] = useState<string | null>(null);

  // Track dark mode state for Lottie animation
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode and set up listener
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    // Initial check
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Use different Lottie animations based on theme
  const lottieAnimationUrl = isDarkMode
    ? "https://qycqsyfqipsmlyqydvso.supabase.co/storage/v1/object/public/lottie-animations//Slidifydarkmode.json"
    : "https://qycqsyfqipsmlyqydvso.supabase.co/storage/v1/object/public/lottie-animations//Slidifylightmode.json";

  // Set default values for unauthenticated users
  useEffect(() => {
    if (slideshowName === "" && message === "" && !editingSlideshowId) {
      // Load random slideshow name and message from database
      const loadRandomSlideshowData = async () => {
        try {
          const { slideshow_name, slideshow_message } =
            await getRandomSlideshowNameMessage();
          setSlideshowName(slideshow_name);
          setMessage(slideshow_message);
        } catch (error) {
          console.error("Error loading random slideshow data:", error);
          // Fallback to default values
          setSlideshowName("My first slideshow on slidify.app");
          setMessage(
            "Trying out this new tool for creating and sharing virtual slideshows - slidify.app"
          );
        }
      };

      loadRandomSlideshowData();
    }
  }, [editingSlideshowId, slideshowName, message]);

  useEffect(() => {
    if (user) {
      fetchUserSlideshows();
      loadSubscriptionMessages();
      fetchUserSubscriptionMessages();
    } else {
      loadSubscriptionMessages();
    }
  }, [user]);

  const loadSubscriptionMessages = async () => {
    const subscriptionType = user ? (isPremium ? 'premium' : 'authenticated') : 'unauthenticated';
    
    // Load message for images section
    const imageMessage = await getSubscriptionMessage(
      subscriptionType,
      'images_section'
    );
    setImageSectionSubscriptionMessage(imageMessage);

    // Load message for music section
    const musicMessage = await getSubscriptionMessage(
      subscriptionType,
      'music_section'
    );
    setMusicSectionSubscriptionMessage(musicMessage);
  };

  // Load random tagline on component mount
  useEffect(() => {
    const loadTagline = async () => {
      try {
        const randomTagline = await getRandomTagline();
        setTagline(randomTagline);
      } catch (error) {
        console.error("Error loading tagline:", error);
        // Keep default tagline if loading fails
      }
    };

    loadTagline();
  }, []);

  // Load subscription message based on user type
  useEffect(() => {
    const loadSubscriptionMessage = async () => {
      try {
        let subscriptionType: string;
        
        if (!user) {
          subscriptionType = 'unauthenticated';
        } else if (isPremium) {
          subscriptionType = 'premium';
        } else {
          subscriptionType = 'authenticated';
        }
        
        const message = await getSubscriptionMessage(subscriptionType, 'images_section');
        setSubscriptionMessage(message);
      } catch (error) {
        console.error('Error loading subscription message:', error);
        setSubscriptionMessage(null);
      }
    };

    loadSubscriptionMessage();
  }, [user, isPremium]);
  // Load subscription-specific message
  useEffect(() => {
    const loadSubscriptionMessage = async () => {
      try {
        // Determine subscription type based on user status and premium subscription
        let subscriptionType: string;
        if (!user) {
          subscriptionType = 'unauthenticated';
        } else if (isPremium) {
          subscriptionType = 'premium';
        } else {
          subscriptionType = 'authenticated';
        }
        
        const location = 'images_section';
        
        const message = await getSubscriptionMessage(subscriptionType, location);
        setImagesSubscriptionMessage(message);
      } catch (error) {
        console.error("Error loading subscription message:", error);
      }
    };

    const loadMusicSubscriptionMessage = async () => {
      try {
        const subscriptionType = !user ? 'unauthenticated' : (isPremium ? 'premium' : 'authenticated');
        const location = 'music_section';
        
        const message = await getSubscriptionMessage(subscriptionType, location);
        
        setMusicSubscriptionMessage(message);
      } catch (error) {
        console.error('Error loading music subscription message:', error);
      }
    };

    loadSubscriptionMessage();
    loadMusicSubscriptionMessage();
  }, [user, isPremium]);

  const refreshSlideshowData = async () => {
    try {
      setIsRefreshingData(true);
      const { slideshow_name, slideshow_message } =
        await getRandomSlideshowNameMessage();
      setSlideshowName(slideshow_name);
      setMessage(slideshow_message);
    } catch (error) {
      console.error("Error refreshing slideshow data:", error);
    } finally {
      setIsRefreshingData(false);
    }
  };

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
      .from("slideshows")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching slideshows:", error);
    } else {
      setUserSlideshows(data || []);
    }
  };

  const fetchUserSubscriptionMessages = async () => {
    try {
      const messages = await getUserSubscriptionMessages();
      setUserSubscriptionMessages(messages);
    } catch (error) {
      console.error('Error fetching subscription messages:', error);
    }
  };

  const handleCreateSubscriptionMessage = async () => {
    if (!newSubscriptionMessage.trim()) return;

    try {
      await createSubscriptionMessage(newSubscriptionMessage, newSubscriptionType, newSubscriptionLocation);
      setNewSubscriptionMessage('');
      setNewSubscriptionType('unauthenticated');
      setNewSubscriptionLocation('images_section');
      fetchUserSubscriptionMessages();
    } catch (error) {
      console.error('Error creating subscription message:', error);
      alert('Error creating subscription message');
    }
  };

  const handleUpdateSubscriptionMessage = async (id: string, message: string, subscriptionType: string, location: string, isActive: boolean) => {
    try {
      await updateSubscriptionMessage(id, message, subscriptionType, location, isActive);
      setEditingSubscriptionMessageId(null);
      fetchUserSubscriptionMessages();
    } catch (error) {
      console.error('Error updating subscription message:', error);
      alert('Error updating subscription message');
    }
  };

  const handleDeleteSubscriptionMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription message?')) return;

    try {
      await deleteSubscriptionMessage(id);
      fetchUserSubscriptionMessages();
    } catch (error) {
      console.error('Error deleting subscription message:', error);
      alert('Error deleting subscription message');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages((prev) => {
      const currentCount = prev.length;
      const availableSlots = isPremium
        ? Math.max(0, 100 - currentCount)
        : Math.max(0, 10 - currentCount);
      const filesToAdd = files.slice(0, availableSlots);

      // Show upgrade modal if user tries to add more than allowed
      if (files.length > availableSlots && availableSlots === 0) {
        setShowUpgradeModal(true);
      }

      return [...prev, ...filesToAdd];
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    setImages((prev) => {
      const currentCount = prev.length;
      const availableSlots = isPremium
        ? Math.max(0, 100 - currentCount)
        : Math.max(0, 10 - currentCount);
      const filesToAdd = imageFiles.slice(0, availableSlots);

      // Show upgrade modal if user tries to add more than allowed
      if (imageFiles.length > availableSlots && availableSlots === 0) {
        setShowUpgradeModal(true);
      }

      return [...prev, ...filesToAdd];
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleImageDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number
  ) => {
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
        musicPreviewRef.play().catch((error) => {
          console.error("Music preview failed:", error);
        });
      } else {
        // Create audio element if it doesn't exist
        const audio = new Audio(selectedMusic.audio_url);
        audio.volume = 0.5;
        audio.onended = () => setIsPreviewingMusic(false);
        audio.play().catch((error) => {
          console.error("Music preview failed:", error);
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
      musicPreviewRef.addEventListener("ended", handleEnded);
      return () => musicPreviewRef.removeEventListener("ended", handleEnded);
    }
  }, [musicPreviewRef]);

  const uploadImages = async (
    imageItems: (File | string)[]
  ): Promise<string[]> => {
    const uploadPromises = imageItems.map(async (item) => {
      if (typeof item === "string") {
        // Already a URL, return as is
        return item;
      } else {
        // It's a File, upload it
        const timestamp = Date.now();
        const sanitizedFileName = item.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = isPremium
          ? `PREMIUM-${timestamp}-${sanitizedFileName}`
          : `${timestamp}-${sanitizedFileName}`;

        const { error } = await supabase.storage
          .from("slideshow-images")
          .upload(fileName, item);

        if (error) {
          console.error("Error uploading image:", error);
          throw error;
        }

        return getPublicUrl("slideshow-images", fileName);
      }
    });

    return Promise.all(uploadPromises);
  };

  const createShareableLink = async () => {
    const openCollaborativeUploadAfterSave = shouldOpenCollaborativeUpload;
    setShouldOpenCollaborativeUpload(false);

    // Only require images if not a premium user doing collaborative upload
    if (!slideshowName.trim()) {
      alert("Please enter a slideshow name");
      return;
    }

    // Check image limit for non-premium users
    if (
      (!isPremium && images.length > 10) ||
      (isPremium && images.length > 100)
    ) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const slideUrls = images.length > 0 ? await uploadImages(images) : [];

      const slideshowData = {
        name: slideshowName,
        audio_url: selectedMusic?.audio_url || null,
        slide_urls: slideUrls,
        slide_duration: slideDuration,
        transition_type: (transitionType ?? "") || "",
        message: message,
        user_id: user?.id || null,
      };

      let data, error;

      if (editingSlideshowId) {
        // Update existing slideshow
        const result = await supabase
          .from("slideshows")
          .update(slideshowData)
          .eq("id", editingSlideshowId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Create new slideshow
        const result = await supabase
          .from("slideshows")
          .insert([slideshowData])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error saving slideshow:", error);
        alert("Error saving slideshow");
        return;
      }

      const url = `${window.location.origin}?view=${data.id}`;
      setShareUrl(url);
      setShowSuccessModal(true);

      // Open collaborative upload modal if requested
      if (openCollaborativeUploadAfterSave && isPremium) {
        setTimeout(() => {
          setShowCollaborativeUploadModal(true);
        }, 500); // Small delay to let success modal show first
      }

      // Reset form after successful save
      setImages([]);
      setSelectedMusic(null);
      setSlideshowName("");
      setMessage("");
      setSlideDuration(4);
      setTransitionType("fade");
      setEditingSlideshowId(null);

      if (user) {
        fetchUserSlideshows();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating shareable link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSlideshow = async (slideshow: Slideshow) => {
    try {
      // Populate form with slideshow data
      setSlideshowName(slideshow.name);
      setMessage(slideshow.message || "");
      setSlideDuration(slideshow.slide_duration);
      setTransitionType(slideshow.transition_type);
      setImages(slideshow.slide_urls); // These are already URLs
      setEditingSlideshowId(slideshow.id);

      // If slideshow has audio, find and set the music
      if (slideshow.audio_url) {
        const { data: musicData, error } = await supabase
          .from("music")
          .select("*")
          .eq("audio_url", slideshow.audio_url);

        if (!error && musicData && musicData.length > 0) {
          setSelectedMusic(musicData[0]);
        }
      } else {
        setSelectedMusic(null);
      }

      // Scroll to top to show the form
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error loading slideshow for editing:", error);
      alert("Error loading slideshow for editing");
    }
  };

  const deleteSlideshow = async (id: string) => {
    const slideshow = userSlideshows.find((s) => s.id === id);
    if (!slideshow) return;

    setSlideshowToDelete({ id, name: slideshow.name });
    setShowDeleteConfirmationModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!slideshowToDelete) return;

    const { error } = await supabase
      .from("slideshows")
      .delete()
      .eq("id", slideshowToDelete.id);

    if (error) {
      console.error("Error deleting slideshow:", error);
      alert("Error deleting slideshow");
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
    const slideshowId = urlParams.get("slideshow");

    if (slideshowId) {
      fetchSharedSlideshow(slideshowId);
    }
  }, []);

  const fetchSharedSlideshow = async (id: string) => {
    const { data, error } = await supabase
      .from("slideshows")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching shared slideshow:", error);
    } else {
      setCurrentSlideshow(data);
      setShowSlideshowViewer(true);
    }
  };

  return (
    <>
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
                <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Slidify.app
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                  {tagline}
                </p>

                <div className="flex justify-center">
                  {user ? (
                    <div className="flex items-center gap-2">
                      {isPremium && !subscriptionLoading && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 px-2 py-1 rounded-full">
                          <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            {productName || "Premium"}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => setShowUserSettings(true)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={user?.email || ""}
                      >
                        <User className="w-5 h-5" />
                      </button>
                      {!isPremium && !subscriptionLoading && (
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2 py-1 rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all"
                        >
                          <Crown className="w-3 h-3 inline mr-1" />
                          Try Premium
                        </button>
                      )}
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
              <div className="flex-shrink-0 w-10"></div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-4 space-y-8">
          {/* Upload Images */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Images
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                {parseFormattedMessage(imageSectionSubscriptionMessage || '')}
              </span>
             </h2>

            {/* Display subscription message if available */}

            {images.length === 0 ? (
              <>
                <div
                  className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Drag and drop images here, or click to select
                  </p>
                  {!isPremium && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      (Max 10 for free users)
                    </p>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                </div>
                
                {/* Premium Feature Indicator */}
                <button
                  onClick={async () => {
                    if (isPremium) {
                      if (!slideshowName.trim()) {
                        alert(
                          "Please enter a slideshow name before creating a collaborative upload session"
                        );
                        return;
                      }

                      // Set flag to open collaborative upload after save
                      setShouldOpenCollaborativeUpload(true);
                      // Save the slideshow
                      createShareableLink();
                    } else {
                      setShowUpgradeModal(true);
                    }
                  }}
                  disabled={isLoading || !slideshowName.trim()}
                  className="mt-4 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >

                </button>
              </>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative group cursor-move ${
                        draggedIndex === index ? "dragging" : ""
                      } ${dragOverIndex === index ? "drag-over" : ""}`}
                      draggable
                      onDragStart={(e) => handleImageDragStart(e, index)}
                      onDragOver={(e) => handleImageDragOver(e, index)}
                      onDragLeave={handleImageDragLeave}
                      onDrop={(e) => handleImageDrop(e, index)}
                      onDragEnd={handleImageDragEnd}
                    >
                      <img
                        src={
                          typeof image === "string"
                            ? image
                            : URL.createObjectURL(image)
                        }
                        alt={`Slide ${index + 1}`}
                        className="w-full h-24 object-contain rounded-lg select-none bg-gray-100 dark:bg-gray-600"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X size={14} />
                      </button>
                      {/* Drag indicator */}
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  {/* Add more images button */}
                  {((!isPremium && images.length < 10) ||
                    (isPremium && images.length < 100)) && (
                    <div className="relative group">
                      <div
                        className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="add-more-images"
                        />
                        <label
                          htmlFor="add-more-images"
                          className="cursor-pointer flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Upload className="w-6 h-6 mb-1" />
                          <span className="text-xs">Add more</span>
                        </label>
                      </div>
                    </div>
                  )}
                  {((!isPremium && images.length >= 10) ||
                    (isPremium && images.length >= 100)) && (
                    <div className="relative group">
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                          isPremium
                            ? "border-yellow-300 dark:border-yellow-600 hover:border-yellow-400 dark:hover:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                            : "border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        }`}
                      >
                        <Crown
                          className={`w-6 h-6 mb-1 ${
                            isPremium
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            isPremium
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-blue-600 dark:text-blue-400"
                          } font-medium`}
                        >
                          {isPremium ? "Limit reached" : "Upgrade"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Premium Feature: Collaboration Toggle */}
                {isPremium && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown
                          className="text-blue-600 dark:text-blue-400"
                          size={20}
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          Collaboration:
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setCollaborationEnabled(!collaborationEnabled)
                        }
                        className="relative inline-flex items-center cursor-pointer"
                      >
                        <div
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            collaborationEnabled
                              ? "bg-blue-600"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                              collaborationEnabled
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          ></div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Premium Feature: Invite others to submit images - Always visible */}
            {!isPremium && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Crown
                    className="text-blue-600 dark:text-blue-400"
                    size={20}
                  />
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {/*  Premium Feature: Invite others to submit images */}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                   {/* Create a shareable link that allows friends, family, or
                  colleagues to upload images directly to your slideshow.
                  Perfect for events, trips, or group projects!*/}
                </p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all text-sm font-medium"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>

          {/* Background Music */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Music className="w-6 h-6 text-blue-600" />
              Background Music
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                {parseFormattedMessage(musicSectionSubscriptionMessage || '')}
              </span>
              {!isPremium && (
                <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                </span>
              )}
            </h2>
            


            {selectedMusic ? (
              <div
                className="group flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setShowMusicSelector(true)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 dark:text-white truncate flex-1">
                    {selectedMusic.song_title}
                  </h3>
                  <Clock
                    size={14}
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {Math.floor(selectedMusic.duration / 60)}:
                    {(selectedMusic.duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMusicPreview();
                  }}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
                  title={isPreviewingMusic ? "Stop preview" : "Preview music"}
                >
                  {isPreviewingMusic ? <Pause size={16} /> : <Play size={16} />}
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
              <>
                <button
                  onClick={() => setShowMusicSelector(true)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Choose background music (optional)
                  </p>
                </button>

                {/* Premium Feature Indicator */}
                <button
                  onClick={() => {
                    if (isPremium) {
                      setShowMusicSelector(true);
                    } else {
                      setShowUpgradeModal(true);
                    }
                  }}
                  className="mt-4 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
            {/* Subscription Message for Music */}
            {musicSectionSubscriptionMessage && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  {parseMessageWithIcons(musicSectionSubscriptionMessage)}
                </p>
              </div>
            )}
                </button>
              </>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slideshow Name *
                    <button
                      type="button"
                      onClick={refreshSlideshowData}
                      disabled={isRefreshingData}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                      title="Get random slideshow name and message"
                    >
                      <Dices
                        size={16}
                        className={isRefreshingData ? "animate-spin" : ""}
                      />
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={slideshowName}
                      onChange={(e) => setSlideshowName(e.target.value)}
                      id="slideshow-name"
                      name="slideshowName"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter slideshow name"
                    />
                    {slideshowName && (
                      <button
                        type="button"
                        onClick={() => setSlideshowName("")}
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
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      id="slideshow-message"
                      name="message"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder="Add a message to your slideshow"
                    />
                    {message && (
                      <button
                        type="button"
                        onClick={() => setMessage("")}
                        className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Clear message"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
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
                    id="slide-duration"
                    name="slideDuration"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transition Effect
                  </label>
                  <select
                    value={transitionType || ""}
                    onChange={(e) => setTransitionType(e.target.value)}
                    id="transition-type"
                    name="transitionType"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="cover">Cover</option>
                    <option value="door">Door</option>
                    <option value="fade">Fade</option>
                    <option value="fadeBlack">Fade through black</option>
                    <option value="flip">Flip horizontal</option>
                    <option value="flipVertical">Flip vertical</option>
                    <option value="reveal">Reveal</option>
                    <option value="scaleAdvanced">Scale</option>
                    <option value="slideLeft">Slide left</option>
                    <option value="slideRight">Slide right</option>
                    <option value="slideUp">Slide up</option>
                    <option value="slideDown">Slide down</option>
                    <option value="spiral">Spiral</option>
                    <option value="uncover">Uncover</option>
                    <option value="wipe">Wipe</option>
                    <option value="zoomIn">Zoom in</option>
                    <option value="zoomOut">Zoom out</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {images.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-blue-600" />
                Preview
              </h2>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <SlideshowViewer
                  slideshowId="temp"
                  mode="embedded-preview"
                  initialSlideshow={{
                    id: "preview-slideshow",
                    name: slideshowName || "Preview",
                    message: message,
                    slide_urls: images.map((img) =>
                      typeof img === "string" ? img : URL.createObjectURL(img)
                    ),
                    audio_url: selectedMusic?.audio_url || null,
                    slide_duration: slideDuration,
                    transition_type: transitionType,
                    user_id: "",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }}
                />
              </div>
            </div>
          )}

          {/* Create Shareable Link */}
          <button
            onClick={createShareableLink}
            disabled={isLoading || images.length === 0 || !slideshowName.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg font-semibold shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {editingSlideshowId ? "Saving Changes..." : "Creating Link..."}
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                {editingSlideshowId ? "Save Changes" : "Create Shareable Link"}
              </>
            )}
          </button>

          {/* Your Slideshows */}
          {user && userSlideshows.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                My Slideshows
              </h2>
              <div className="space-y-3">
                {userSlideshows.map((slideshow) => (
                  <div
                    key={slideshow.id}
                    className="flex flex-col p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="w-full">
                      <h3 className="font-medium text-gray-800 dark:text-white">
                        {slideshow.name}
                      </h3>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow min-w-0">
                          {slideshow.slide_urls.length} slides • Created{" "}
                          {new Date(slideshow.created_at).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(slideshow.created_at).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                        <div className="flex gap-2">
                          {isPremium && (
                            <button
                              onClick={() => handleEditSlideshow(slideshow)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit slideshow"
                            >
                              <Edit className="w-6 h-6" />
                            </button>
                          )}
                          {isPremium && (
                            <button
                              onClick={() =>
                                setShowCollaborativeUploadModal(true)
                              }
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Create collaborative upload link"
                            >
                              <Share2 className="w-6 h-6" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}?view=${slideshow.id}`;
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View slideshow"
                          >
                            <Eye className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}?view=${slideshow.id}`;
                              navigator.clipboard
                                .writeText(url)
                                .then(() => {
                                  setCopiedSlideshowId(slideshow.id);
                                  setTimeout(
                                    () => setCopiedSlideshowId(null),
                                    2000
                                  );
                                })
                                .catch(() => {
                                  // Fallback for browsers that don't support clipboard API
                                  const textArea =
                                    document.createElement("textarea");
                                  textArea.value = url;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand("copy");
                                  document.body.removeChild(textArea);
                                  setCopiedSlideshowId(slideshow.id);
                                  setTimeout(
                                    () => setCopiedSlideshowId(null),
                                    2000
                                  );
                                });
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Copy share link"
                          >
                            {copiedSlideshowId === slideshow.id ? (
                              <Check className="w-6 h-6" />
                            ) : (
                              <Copy className="w-6 h-6" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteSlideshow(slideshow.id)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Delete slideshow"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
             
          

        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16 transition-colors">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <a
                href="/privacy"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </a>
              <span className="hidden sm:inline">•</span>
              <a
                href="/terms"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms of Service
              </a>
              <span className="hidden sm:inline">•</span>
              <a
                href="/release-notes"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Release Notes
              </a>
              <span className="hidden sm:inline">•</span>
              <a
                href="/contact"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </div>
         </div>
        </footer>

        {/* Modals */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
            onSignUpSuccess={() => {
              setShowAuthModal(false);
              setTimeout(() => {
                setShowConversionModal(true);
              }, 300);
            }}
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

        {/* Subscription Messages Management */}
        {showUserSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Crown className="w-6 h-6 text-blue-600" />
              Subscription Messages
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Manage custom messages that appear in subscription-related areas of the app.
            </p>

            {/* Create New Subscription Message */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 transition-colors">
              <h3 className="font-medium text-gray-800 dark:text-white mb-3">Create New Message</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message Text
                  </label>
                  <input
                    type="text"
                    value={newSubscriptionMessage}
                    onChange={(e) => setNewSubscriptionMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter subscription message"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subscription Type
                    </label>
                    <select
                      value={newSubscriptionType}
                      onChange={(e) => setNewSubscriptionType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="unauthenticated">Unauthenticated</option>
                      <option value="authenticated">Authenticated</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <select
                      value={newSubscriptionLocation}
                      onChange={(e) => setNewSubscriptionLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="images_section">Images Section</option>
                      <option value="music_section">Music Section</option>
                      <option value="settings_section">Settings Section</option>
                      <option value="preview_section">Preview Section</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleCreateSubscriptionMessage}
                  disabled={!newSubscriptionMessage.trim()}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Message
                </button>
              </div>
            </div>

            {/* Existing Subscription Messages */}
            {userSubscriptionMessages.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800 dark:text-white">Your Messages</h3>
                {userSubscriptionMessages.map((message) => (
                  <div key={message.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
                    {editingSubscriptionMessageId === message.id ? (
                      <SubscriptionMessageEditor
                        message={message}
                        onSave={(updatedMessage, subscriptionType, location, isActive) => 
                          handleUpdateSubscriptionMessage(message.id, updatedMessage, subscriptionType, location, isActive)
                        }
                        onCancel={() => setEditingSubscriptionMessageId(null)}
                      />
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-800 dark:text-white font-medium mb-1">
                            {message.message}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                              {message.subscription_type}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                              {message.location.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              message.is_active 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              {message.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => setEditingSubscriptionMessageId(message.id)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit message"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriptionMessage(message.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Feedback Button */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-full shadow-lg hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm font-medium"
        title="Give us feedback"
      >
        <MessageSquare size={16} />
        Feedback
      </button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {/* Collaborative Upload Modal */}
      {showCollaborativeUploadModal && (
        <CollaborativeUploadModal
          isOpen={showCollaborativeUploadModal}
          onClose={() => {
            setShowCollaborativeUploadModal(false);
            // Clear URL parameter if it exists
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('openModal')) {
              urlParams.delete('openModal');
              const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
              window.history.replaceState({}, document.title, newUrl);
            }
          }}
          onImagesAdded={(newImages) => {
            setImages((prev) => [...prev, ...newImages]);
          }}
        />
      )}

      {/* Conversion Modal */}
      {showConversionModal && (
        <ConversionModal
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          onSignUp={() => {
            setShowConversionModal(false);
            setShowAuthModal(true);
          }}
        />
      )}
    </>
  );
}

// Subscription Message Editor Component
interface SubscriptionMessageEditorProps {
  message: any;
  onSave: (message: string, subscriptionType: string, location: string, isActive: boolean) => void;
  onCancel: () => void;
}

function SubscriptionMessageEditor({ message, onSave, onCancel }: SubscriptionMessageEditorProps) {
  const [editMessage, setEditMessage] = useState(message.message);
  const [editSubscriptionType, setEditSubscriptionType] = useState(message.subscription_type);
  const [editLocation, setEditLocation] = useState(message.location);
  const [editIsActive, setEditIsActive] = useState(message.is_active);

  const handleSave = () => {
    if (!editMessage.trim()) return;
    onSave(editMessage, editSubscriptionType, editLocation, editIsActive);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Message Text
        </label>
        <input
          type="text"
          value={editMessage}
          onChange={(e) => setEditMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subscription Type
          </label>
          <select
            value={editSubscriptionType}
            onChange={(e) => setEditSubscriptionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="unauthenticated">Unauthenticated</option>
            <option value="authenticated">Authenticated</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <select
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="images_section">Images Section</option>
            <option value="music_section">Music Section</option>
            <option value="settings_section">Settings Section</option>
            <option value="preview_section">Preview Section</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={`active-${message.id}`}
          checked={editIsActive}
          onChange={(e) => setEditIsActive(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor={`active-${message.id}`} className="text-sm text-gray-700 dark:text-gray-300">
          Active
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!editMessage.trim()}
          className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}