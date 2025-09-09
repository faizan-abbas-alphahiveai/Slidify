import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";
import {
  Upload,
  Music,
  Play,
  Pause,
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
  Users,
  ExternalLink,
  Plus,
  HelpCircle,
  QrCode,
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
import ToastContainer from "./components/ToastContainer";
import FeedbackModal from "./components/FeedbackModal";
import CollaborativeUploadModal from "./components/CollaborativeUploadModal";
import ConversionModal from "./components/ConversionModal";
import CustomSelect from "./components/CustomSelect";
import ImageManagementModal from "./components/ImageManagementModal";
import { MessageZone } from "./components/MessageZone";
import { QRCodeSVG } from "qrcode.react";

// Icon mapping for dynamic icon rendering within messages
const iconMap = {
  Crown,
  Users,
  Music,
  Upload,
};

// Helper function to parse markdown within a string and return React nodes
const parseTextWithMarkdown = (text: string, keyPrefix: string) => {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  const markdownRegex =
    /(\[([^\]]+?)\]\((https?:\/\/[^\s]+?)\))|(`([^`]+?)`)|(~~(.*?)~~)|(__(.+?)__)|(\*\*(.*?)\*\*)|(\*(.*?)\*)/g;

  let match: RegExpExecArray | null;
  while ((match = markdownRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    const linkText = match[2];
    const linkUrl = match[3];
    const codeText = match[5];
    const strikeText = match[7];
    const underlineText = match[9];
    const boldText = match[11];
    const italicText = match[13];

    if (linkText && linkUrl) {
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
      elements.push(
        <code
          key={`${keyPrefix}-code-${match.index}`}
          className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono"
        >
          {codeText}
        </code>
      );
    } else if (strikeText) {
      elements.push(
        <span key={`${keyPrefix}-strike-${match.index}`} className="line-through">
          {strikeText}
        </span>
      );
    } else if (underlineText) {
      elements.push(
        <span key={`${keyPrefix}-underline-${match.index}`} className="underline">
          {underlineText}
        </span>
      );
    } else if (boldText) {
      elements.push(
        <strong key={`${keyPrefix}-bold-${match.index}`}>{boldText}</strong>
      );
    } else if (italicText) {
      elements.push(
        <em key={`${keyPrefix}-italic-${match.index}`}>{italicText}</em>
      );
    }

    lastIndex = markdownRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements;
};

// Main parsing function for icons and markdown
const parseFormattedMessage = (message: string) => {
  const result: React.ReactNode[] = [];
  const parts = message.split(/(\[icon:[^\]]+?(?::[^\]]+?)?\])/g);

  parts.forEach((part, index) => {
    if (part.startsWith("[icon:") && part.endsWith("]")) {
      const match = part.match(/\[icon:([^\]]+?)(?::([^\]]+?))?\]/);
      if (match) {
        const iconName = match[1];
        const colorClass = match[2] || "text-blue-600";
        const IconComponent = iconMap[iconName as keyof typeof iconMap];
        if (IconComponent) {
          result.push(
            <IconComponent
              key={`icon-${index}`}
              size={16}
              className={`inline-block align-middle mr-1 ${colorClass}`}
            />
          );
        }
      } else {
        result.push(<span key={`malformed-icon-${index}`}>{part}</span>);
      }
    } else {
      result.push(...parseTextWithMarkdown(part, `text-part-${index}`));
    }
  });

  return result;
};

// Function to parse the message and insert icons (simple version)
const parseMessageWithIcons = (message: string) => {
  if (!message) return null;
  const parts = message.split(/(\[icon:[^\]]+\])/);
  return parts.map((part, index) => {
    if (part.startsWith("[icon:") && part.endsWith("]")) {
      const iconName = part.substring(6, part.length - 1);
      const IconComponent = iconMap[iconName as keyof typeof iconMap];
      if (IconComponent) {
        return (
          <IconComponent key={index} size={16} className="inline-block mx-1 align-middle" />
        );
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

interface UploadSession {
  id: string;
  slideshow_id: string | null;
  session_token: string;
  max_uploads: number;
  current_uploads: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

interface Music {
  id: string;
  song_title: string;
  audio_url: string;
  duration: number;
}

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export default function App() {
  const { user, signOut, refreshUserProfile } = useAuth();
  const { isPremium, isLoading: subscriptionLoading, productName } = useSubscription();

  const [images, setImages] = useState<(File | string)[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [slideDuration, setSlideDuration] = useState(4);
  const [transitionType, setTransitionType] = useState("fade");
  const [slideshowName, setSlideshowName] = useState("");
  const [message, setMessage] = useState("");
  const [editingSlideshowId, setEditingSlideshowId] = useState<string | null>(null);
  const [copiedSlideshowId, setCopiedSlideshowId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Toast helper functions
  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

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
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [lastSavedSlideshow, setLastSavedSlideshow] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [isPreviewingMusic, setIsPreviewingMusic] = useState(false);
  const [musicPreviewRef, setMusicPreviewRef] = useState<HTMLAudioElement | null>(null);

  const [tagline, setTagline] = useState("Create beautiful slideshows with a few simple clicks");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCollaborativeUploadModal, setShowCollaborativeUploadModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);

  // Transition options for custom select
  const transitionOptions = [
    { value: "cover", label: "Cover" },
    { value: "door", label: "Door" },
    { value: "fade", label: "Fade" },
    { value: "fadeBlack", label: "Fade through black" },
    { value: "flip", label: "Flip horizontal" },
    { value: "flipVertical", label: "Flip vertical" },
    { value: "reveal", label: "Reveal" },
    { value: "scaleAdvanced", label: "Scale" },
    { value: "slideLeft", label: "Slide left" },
    { value: "slideRight", label: "Slide right" },
    { value: "slideUp", label: "Slide up" },
    { value: "slideDown", label: "Slide down" },
    { value: "spiral", label: "Spiral" },
    { value: "uncover", label: "Uncover" },
    { value: "wipe", label: "Wipe" },
    { value: "zoomIn", label: "Zoom in" },
    { value: "zoomOut", label: "Zoom out" },
    { value: "none", label: "None" }
  ];
  const [showImageManagementModal, setShowImageManagementModal] = useState(false);
  const [slideshowPreviewImages, setSlideshowPreviewImages] = useState<(File | string)[]>([]);
  const [collaborativeImages, setCollaborativeImages] = useState<Array<{
    id: string;
    image_url: string;
    uploaded_by_name: string;
    uploaded_by_email: string;
    created_at: string;
  }>>([]);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [shouldOpenCollaborativeUpload, setShouldOpenCollaborativeUpload] = useState(false);
  
  // Collaborative upload session state
  const [activeUploadSession, setActiveUploadSession] = useState<UploadSession | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Copy link and QR state for outer allow upload toggle
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // DB-driven subscription messages by section
  const [imageSectionSubscriptionMessage, setImageSectionSubscriptionMessage] = useState<string | null>(null);
  const [musicSectionSubscriptionMessage, setMusicSectionSubscriptionMessage] = useState<string | null>(null);
  const [settingsSectionSubscriptionMessage, setSettingsSectionSubscriptionMessage] = useState<string | null>(null);

  // Admin mgmt state (unchanged)
  const [subscriptionMessage, setSubscriptionMessage] = useState<string>("");
  const [userSubscriptionMessages, setUserSubscriptionMessages] = useState<any[]>([]);
  const [newSubscriptionMessage, setNewSubscriptionMessage] = useState("");
  const [newSubscriptionType, setNewSubscriptionType] = useState("unauthenticated");
  const [newSubscriptionLocation, setNewSubscriptionLocation] = useState("images_section");
  const [editingSubscriptionMessageId, setEditingSubscriptionMessageId] = useState<string | null>(null);

  // Theme-detected lottie
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const lottieAnimationUrl = isDarkMode
    ? "https://qycqsyfqipsmlyqydvso.supabase.co/storage/v1/object/public/lottie-animations//Slidifydarkmode.json"
    : "https://qycqsyfqipsmlyqydvso.supabase.co/storage/v1/object/public/lottie-animations//Slidifylightmode.json";

  // Defaults for unauthenticated users (random name/message)
  useEffect(() => {
    if (slideshowName === "" && message === "" && !editingSlideshowId) {
      const loadRandomSlideshowData = async () => {
        try {
          const { slideshow_name, slideshow_message } = await getRandomSlideshowNameMessage();
          setSlideshowName(slideshow_name);
          setMessage(slideshow_message);
        } catch (error) {
          console.error("Error loading random slideshow data:", error);
          setSlideshowName("My first slideshow on slidify.app");
          setMessage("Trying out this new tool for creating and sharing virtual slideshows - slidify.app");
        }
      };
      loadRandomSlideshowData();
    }
  }, [editingSlideshowId, slideshowName, message]);

  // Load tagline
  useEffect(() => {
    const loadTagline = async () => {
      try {
        const randomTagline = await getRandomTagline();
        setTagline(randomTagline);
      } catch (error) {
        console.error("Error loading tagline:", error);
      }
    };
    loadTagline();
  }, []);

  // Load section messages (images, music, settings) whenever user/premium changes
  useEffect(() => {
    const loadSubscriptionMessages = async () => {
      try {
        const subscriptionType = user ? (isPremium ? "premium" : "authenticated") : "unauthenticated";

        const [imageMsg, musicMsg, settingsMsg] = await Promise.all([
          getSubscriptionMessage(subscriptionType, "images_section"),
          getSubscriptionMessage(subscriptionType, "music_section"),
          getSubscriptionMessage(subscriptionType, "settings_section"),
        ]);

        // Filter out irrelevant or malformed messages
        const cleanImageMsg = imageMsg && 
          !imageMsg.includes('[Link text]') && 
          !imageMsg.includes('example.com') && 
          !imageMsg.includes('This is for AUTHENTICATED users in the images section') &&
          !imageMsg.includes('This is for') &&
          !imageMsg.includes('users in the images section') ? imageMsg : null;
        const cleanMusicMsg = musicMsg && 
          !musicMsg.includes('[Link text]') && 
          !musicMsg.includes('example.com') &&
          !musicMsg.includes('This is for AUTHENTICATED users in the music section') &&
          !musicMsg.includes('This is for') &&
          !musicMsg.includes('users in the music section') ? musicMsg : null;
        const cleanSettingsMsg = settingsMsg && 
          !settingsMsg.includes('[Link text]') && 
          !settingsMsg.includes('example.com') &&
          !settingsMsg.includes('This is for AUTHENTICATED users in the settings section') &&
          !settingsMsg.includes('This is for') &&
          !settingsMsg.includes('users in the settings section') ? settingsMsg : null;

        setImageSectionSubscriptionMessage(cleanImageMsg);
        setMusicSectionSubscriptionMessage(cleanMusicMsg);
        setSettingsSectionSubscriptionMessage(cleanSettingsMsg);

        // legacy single message you already maintain (kept to avoid regressions)
        setSubscriptionMessage(cleanImageMsg || "");
      } catch (error) {
        setImageSectionSubscriptionMessage(null);
        setMusicSectionSubscriptionMessage(null);
        setSettingsSectionSubscriptionMessage(null);
      }
    };

    loadSubscriptionMessages();

    if (user) {
      fetchUserSlideshows();
      fetchUserSubscriptionMessages();
      loadActiveUploadSession(); // Load active upload session
    }
  }, [user, isPremium]);

  // Initialize slideshow preview images when images change, but only if user hasn't made manual selections
  useEffect(() => {
    // Only auto-update if slideshowPreviewImages is empty or if it's the initial load
    if (slideshowPreviewImages.length === 0) {
      setSlideshowPreviewImages(images);
    }
  }, [images, slideshowPreviewImages.length]);

  // Clear all user data when user changes (login/logout)
  useEffect(() => {
             if (!user) {
           // User logged out or not authenticated, clear all data
           setImages([]);
           setSlideshowPreviewImages([]);
           setCollaborativeImages([]);
           setSelectedMusic(null);
      setSlideshowName("");
      setMessage("");
      setSlideDuration(4);
      setTransitionType("fade");
      setEditingSlideshowId(null);
      setCurrentSlideshow(null);
      setUserSlideshows([]);
      setShareUrl("");
      setActiveUploadSession(null);
      setShowImageManagementModal(false);
      setShowCollaborativeUploadModal(false);
      setShowSlideshowViewer(false);
      setShowEndModal(false);
      setShowUserSettings(false);
      setShowSuccessModal(false);
      setShowMusicSelector(false);
      setShowUpgradeModal(false);
      setShowFeedbackModal(false);
      setShowConversionModal(false);
      setShowDeleteConfirmationModal(false);
      setSlideshowToDelete(null);
      setCopiedSlideshowId(null);
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsPreviewingMusic(false);
      setMusicPreviewRef(null);
      setTagline("Create beautiful slideshows with a few simple clicks");
      setShowCollaborativeUploadModal(false);
      setShouldOpenCollaborativeUpload(false);
      setCopiedLink(false);
      setShowQrCode(false);
      setImageSectionSubscriptionMessage(null);
      setMusicSectionSubscriptionMessage(null);
      setSettingsSectionSubscriptionMessage(null);
    }
  }, [user]);

  // Cleanup collaborative images when active upload session changes
  useEffect(() => {
    if (!activeUploadSession) {
      setCollaborativeImages([]);
    }
  }, [activeUploadSession]);

  const refreshSlideshowData = async () => {
    try {
      setIsRefreshingData(true);
      const { slideshow_name, slideshow_message } = await getRandomSlideshowNameMessage();
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
    if (refreshUserProfile) refreshUserProfile();
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
      console.error("Error fetching subscription messages:", error);
    }
  };

  const handleCreateSubscriptionMessage = async () => {
    if (!newSubscriptionMessage.trim()) return;
    try {
      await createSubscriptionMessage(newSubscriptionMessage, newSubscriptionType, newSubscriptionLocation);
      setNewSubscriptionMessage("");
      setNewSubscriptionType("unauthenticated");
      setNewSubscriptionLocation("images_section");
      fetchUserSubscriptionMessages();
    } catch (error) {
      console.error("Error creating subscription message:", error);
      alert("Error creating subscription message");
    }
  };

  const handleUpdateSubscriptionMessage = async (
    id: string,
    msg: string,
    subscriptionType: string,
    location: string,
    isActive: boolean
  ) => {
    try {
      await updateSubscriptionMessage(id, msg, subscriptionType, location, isActive);
      setEditingSubscriptionMessageId(null);
      fetchUserSubscriptionMessages();
    } catch (error) {
      console.error("Error updating subscription message:", error);
      alert("Error updating subscription message");
    }
  };

  const handleDeleteSubscriptionMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription message?")) return;
    try {
      await deleteSubscriptionMessage(id);
      fetchUserSubscriptionMessages();
    } catch (error) {
      console.error("Error deleting subscription message:", error);
      alert("Error deleting subscription message");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages((prev) => {
      const currentCount = prev.length;
      const available = isPremium ? Math.max(0, 100 - currentCount) : Math.max(0, 10 - currentCount);
      const filesToAdd = files.slice(0, available);
      if (files.length > available && available === 0) setShowUpgradeModal(true);
      return [...prev, ...filesToAdd];
    });
    
    // Also update slideshow preview images with the new files
    const filesToAdd = Array.from(event.target.files || []).slice(0, isPremium ? 100 : 10);
    setSlideshowPreviewImages((prev) => [...prev, ...filesToAdd]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    setImages((prev) => {
      const currentCount = prev.length;
      const available = isPremium ? Math.max(0, 100 - currentCount) : Math.max(0, 10 - currentCount);
      const filesToAdd = files.slice(0, available);
      if (files.length > available && available === 0) setShowUpgradeModal(true);
      return [...prev, ...filesToAdd];
    });
    
    // Also update slideshow preview images with the new files
    const filesToAdd = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith("image/")).slice(0, isPremium ? 100 : 10);
    setSlideshowPreviewImages((prev) => [...prev, ...filesToAdd]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => event.preventDefault();

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    
    // Also remove the image from slideshow preview if it exists there
    if (imageToRemove) {
      setSlideshowPreviewImages((prev) => 
        prev.filter((img) => img !== imageToRemove)
      );
    }
  };

  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };
  const handleImageDragLeave = () => setDragOverIndex(null);
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    setImages(newImages);
    
    // Also update the slideshow preview to maintain the same order
    setSlideshowPreviewImages((prev) => {
      // Find the dragged image in the preview
      const previewIndex = prev.findIndex(img => img === draggedImage);
      if (previewIndex !== -1) {
        const newPreview = [...prev];
        newPreview.splice(previewIndex, 1);
        // Find the new position in the preview based on the new order
        const newPreviewIndex = newImages.findIndex(img => img === draggedImage);
        newPreview.splice(newPreviewIndex, 0, draggedImage);
        return newPreview;
      }
      return prev;
    });
    
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
      if (musicPreviewRef) {
        musicPreviewRef.pause();
        musicPreviewRef.currentTime = 0;
      }
      setIsPreviewingMusic(false);
    } else {
      if (musicPreviewRef) {
        musicPreviewRef.src = selectedMusic.audio_url;
        musicPreviewRef.currentTime = 0;
        musicPreviewRef.play().catch((error) => console.error("Music preview failed:", error));
      } else {
        const audio = new Audio(selectedMusic.audio_url);
        audio.volume = 0.5;
        audio.onended = () => setIsPreviewingMusic(false);
        audio.play().catch((error) => console.error("Music preview failed:", error));
        setMusicPreviewRef(audio);
      }
      setIsPreviewingMusic(true);
    }
  };

  React.useEffect(() => {
    if (!musicPreviewRef) return;
    const handleEnded = () => setIsPreviewingMusic(false);
    musicPreviewRef.addEventListener("ended", handleEnded);
    return () => musicPreviewRef.removeEventListener("ended", handleEnded);
  }, [musicPreviewRef]);

  const uploadImages = async (imageItems: (File | string)[]): Promise<string[]> => {
    const uploadPromises = imageItems.map(async (item) => {
      if (typeof item === "string") return item;
      const timestamp = Date.now();
      const sanitizedFileName = item.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = isPremium ? `PREMIUM-${timestamp}-${sanitizedFileName}` : `${timestamp}-${sanitizedFileName}`;
      const { error } = await supabase.storage.from("slideshow-images").upload(fileName, item);
      if (error) {
        console.error("Error uploading image:", error);
        throw error;
      }
      return getPublicUrl("slideshow-images", fileName);
    });
    return Promise.all(uploadPromises);
  };

  const saveSlideshow = async (openShareModal = false) => {
    const openCollaborativeUploadAfterSave = shouldOpenCollaborativeUpload;
    setShouldOpenCollaborativeUpload(false);

    if (!slideshowName.trim()) {
      addToast({
        type: 'warning',
        title: 'Slideshow Name Required',
        message: 'Please enter a slideshow name to continue.'
      });
      return;
    }
    if ((!isPremium && slideshowPreviewImages.length > 10) || (isPremium && slideshowPreviewImages.length > 100)) {
      setShowUpgradeModal(true);
      return;
    }

    // Check if slideshow has changed since last save
    const currentHash = getSlideshowHash();
    if (lastSavedSlideshow === currentHash && !openShareModal) {
      addToast({
        type: 'info',
        title: 'No Changes',
        message: 'No changes to save since last update.'
      });
      return;
    }

    // Set appropriate loading state
    if (openShareModal) {
      setIsCreatingLink(true);
    } else {
      setIsSaving(true);
    }
    try {
      const slideUrls = slideshowPreviewImages.length > 0 ? await uploadImages(slideshowPreviewImages) : [];
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
        const result = await supabase
          .from("slideshows")
          .update(slideshowData)
          .eq("id", editingSlideshowId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase.from("slideshows").insert([slideshowData]).select().single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error saving slideshow:", error);
        addToast({
          type: 'error',
          title: 'Save Failed',
          message: 'There was an error saving your slideshow. Please try again.'
        });
        return;
      }

      // Update the saved state hash
      setLastSavedSlideshow(currentHash);

      if (openShareModal) {
      const url = `${window.location.origin}?view=${data.id}`;
      setShareUrl(url);
      setShowSuccessModal(true);

      if (openCollaborativeUploadAfterSave && isPremium) {
        setTimeout(() => setShowCollaborativeUploadModal(true), 500);
      }

      setImages([]);
      setSlideshowPreviewImages([]);
      setSelectedMusic(null);
      setSlideshowName("");
      setMessage("");
      setSlideDuration(4);
      setTransitionType("fade");
      setEditingSlideshowId(null);
      setLastSavedSlideshow(null); // Reset when creating new slideshow
      } else {
        // Just show a simple success message for save only
        addToast({
          type: 'success',
          title: editingSlideshowId ? 'Slideshow Updated!' : 'Slideshow Saved!',
          message: editingSlideshowId ? 'Your slideshow has been updated successfully.' : 'Your slideshow has been saved successfully.'
        });
      }

      if (user) fetchUserSlideshows();
    } catch (error) {
      console.error("Error:", error);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'There was an error saving your slideshow. Please try again.'
      });
    } finally {
      setIsSaving(false);
      setIsCreatingLink(false);
    }
  };

  // Generate a hash of current slideshow data to detect changes
  const getSlideshowHash = () => {
    const data = {
      name: slideshowName,
      message: message,
      slideDuration: slideDuration,
      transitionType: transitionType,
      audioUrl: selectedMusic?.audio_url || null,
      imageCount: slideshowPreviewImages.length
    };
    return JSON.stringify(data);
  };

  // Reset saved state when slideshow data changes
  const resetSavedState = () => {
    const currentHash = getSlideshowHash();
    if (lastSavedSlideshow && lastSavedSlideshow !== currentHash) {
      setLastSavedSlideshow(null);
    }
  };

  const createShareableLink = async () => {
    await saveSlideshow(true);
  };

  // Reset saved state when slideshow data changes
  useEffect(() => {
    resetSavedState();
  }, [slideshowName, message, slideDuration, transitionType, selectedMusic, slideshowPreviewImages.length]);

  const resetSlideshowPreview = () => {
    setSlideshowPreviewImages(images);
  };

  const handleLogout = () => {
           // Clear all user data before signing out
       setImages([]);
       setSlideshowPreviewImages([]);
       setCollaborativeImages([]);
       setSelectedMusic(null);
    setSlideshowName("");
    setMessage("");
    setSlideDuration(4);
    setTransitionType("fade");
    setEditingSlideshowId(null);
    setCurrentSlideshow(null);
    setUserSlideshows([]);
    setShareUrl("");
    setActiveUploadSession(null);
    setShowImageManagementModal(false);
    setShowCollaborativeUploadModal(false);
    setShowSlideshowViewer(false);
    setShowEndModal(false);
    setShowUserSettings(false);
    setShowSuccessModal(false);
    setShowMusicSelector(false);
    setShowUpgradeModal(false);
    setShowFeedbackModal(false);
    setShowConversionModal(false);
    setShowDeleteConfirmationModal(false);
    setSlideshowToDelete(null);
    setCopiedSlideshowId(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsPreviewingMusic(false);
    setMusicPreviewRef(null);
    setTagline("Create beautiful slideshows with a few simple clicks");
    setShowCollaborativeUploadModal(false);
    setShouldOpenCollaborativeUpload(false);
    setCopiedLink(false);
    setShowQrCode(false);
    setImageSectionSubscriptionMessage(null);
    setMusicSectionSubscriptionMessage(null);
    setSettingsSectionSubscriptionMessage(null);
    
    // Then sign out
    signOut();
  };

  const handleEditSlideshow = async (slideshow: Slideshow) => {
    try {
      setSlideshowName(slideshow.name);
      setMessage(slideshow.message || "");
      setSlideDuration(slideshow.slide_duration);
      setTransitionType(slideshow.transition_type);
      setImages(slideshow.slide_urls);
      setSlideshowPreviewImages(slideshow.slide_urls);
      setEditingSlideshowId(slideshow.id);

      if (slideshow.audio_url) {
        const { data: musicData, error } = await supabase.from("music").select("*").eq("audio_url", slideshow.audio_url);
        if (!error && musicData && musicData.length > 0) {
          setSelectedMusic(musicData[0]);
        }
      } else {
        setSelectedMusic(null);
      }

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
    const { error } = await supabase.from("slideshows").delete().eq("id", slideshowToDelete.id);
    if (error) {
      console.error("Error deleting slideshow:", error);
      alert("Error deleting slideshow");
    } else {
      fetchUserSlideshows();
    }
    setShowDeleteConfirmationModal(false);
    setSlideshowToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmationModal(false);
    setSlideshowToDelete(null);
  };

  // Collaborative upload session functions
  const loadActiveUploadSession = async () => {
    if (!user) return;

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('upload_sessions')
        .select('*') // Select all fields including session_token
        .eq('creator_user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;

      if (sessionData) {
        setActiveUploadSession(sessionData);
        // Load collaborative images for this session
        await loadCollaborativeImages(sessionData.id);
      } else {
        setActiveUploadSession(null);
        setCollaborativeImages([]);
      }
    } catch (error) {
      console.error('Error loading active upload session:', error);
      setActiveUploadSession(null);
    }
  };

  const loadCollaborativeImages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('upload_session_images')
        .select('*')
        .eq('upload_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out any images that might have invalid URLs, are corrupted, or are marked as deleted
      const validImages = (data || []).filter(img => 
        img.image_url && 
        img.image_url.trim() !== '' && 
        img.id &&
        // Only filter by soft delete fields if they exist
        (img.is_deleted === undefined || !img.is_deleted) && // Filter out deleted images
        (img.deleted_at === undefined || !img.deleted_at) // Filter out images with deletion timestamp
      );
      
      setCollaborativeImages(validImages);
    } catch (error) {
      setCollaborativeImages([]);
    }
  };

  // Set up real-time subscription for collaborative image updates
  useEffect(() => {
    if (!activeUploadSession) return;

    const sessionChannel = supabase
      .channel('upload_session_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'upload_session_images',
          filter: `upload_session_id=eq.${activeUploadSession.id}`
        },
        (payload) => {
          if (payload.new && payload.new.upload_session_id === activeUploadSession.id) {
            setCollaborativeImages(prev => [payload.new, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'upload_session_images',
          filter: `upload_session_id=eq.${activeUploadSession.id}`
        },
        (payload) => {
          if (payload.old) {
            setCollaborativeImages(prev => prev.filter(img => img.id !== payload.old.id));
            // Also update preview if this image was in it
            setSlideshowPreviewImages(prev => 
              prev.filter(img => img !== payload.old.image_url)
            );
          }
        }
      )
      .subscribe();

    return () => {
      sessionChannel.unsubscribe();
      // Clear collaborative images when subscription is cleaned up
      setCollaborativeImages([]);
    };
  }, [activeUploadSession?.id]);

  const createUploadSession = async () => {
    if (!user) return;

    try {
      setIsCreatingSession(true);
      const { data, error } = await supabase
        .from('upload_sessions')
        .insert([{
          creator_user_id: user.id,
          max_uploads: 100,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }])
        .select('*') // Select all fields including session_token
        .single();

      if (error) throw error;
      

      setActiveUploadSession(data);
      // Clear any existing collaborative images when creating a new session
      setCollaborativeImages([]);
    } catch (error) {
      console.error('Error creating upload session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const deactivateUploadSession = async () => {
    if (!activeUploadSession) return;

    try {
      // First, delete all collaborative images from this session
      if (collaborativeImages.length > 0) {
        const imageIds = collaborativeImages.map(img => img.id);
        

        
        // Delete from storage first
        for (const collaborativeImage of collaborativeImages) {
          if (collaborativeImage.image_url.includes('supabase.co/storage')) {
            try {
              const urlParts = collaborativeImage.image_url.split('/');
              const bucket = urlParts[urlParts.length - 3];
              const path = urlParts.slice(urlParts.length - 2).join('/');
              
              const { error: storageError } = await supabase.storage
                .from(bucket)
                .remove([path]);
              
              if (storageError) {
                console.error('Error deleting from storage:', storageError);
              }
            } catch (storageError) {
              console.error('Error deleting from storage:', storageError);
            }
          }
        }
        
        // Then delete from database
        const { error: deleteError } = await supabase
          .from('upload_session_images')
          .delete()
          .in('id', imageIds);
        
        if (deleteError) {
          console.error('Error deleting collaborative images:', deleteError);
        }
      }
      
      // Deactivate the session
      const { error } = await supabase
        .from('upload_sessions')
        .update({ is_active: false })
        .eq('id', activeUploadSession.id);

      if (error) throw error;
      
      // Clear local state
      setActiveUploadSession(null);
      setCollaborativeImages([]);
      

    } catch (error) {
      console.error('Error deactivating upload session:', error);
    }
  };

  const handleToggleCollaboration = async () => {
    if (!user) return;

    if (activeUploadSession?.is_active) {
      // Turn off - deactivate session
      await deactivateUploadSession();
    } else {
      // Turn on - always create new session to ensure clean state
      await createUploadSession();
    }
  };

  const copyShareLink = async () => {
    if (!activeUploadSession) return;

    // Properly encode the session token for URLs
    const encodedToken = encodeURIComponent(activeUploadSession.session_token);
    const shareLink = `${window.location.origin}/upload?session=${encodedToken}`;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };



  const viewSlideshow = (slideshow: Slideshow) => {
    setCurrentSlideshow(slideshow);
    setShowSlideshowViewer(true);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const slideshowId = urlParams.get("slideshow");
    if (slideshowId) fetchSharedSlideshow(slideshowId);
  }, []);

  const fetchSharedSlideshow = async (id: string) => {
    const { data, error } = await supabase.from("slideshows").select("*").eq("id", id).single();
    if (error) {
      console.error("Error fetching shared slideshow:", error);
    } else {
      setCurrentSlideshow(data);
      setShowSlideshowViewer(true);
    }
  };

  // Function to download QR code as image
  const downloadQRCode = () => {
    try {
      const qrCodeElement = document.querySelector('[data-qr-code]') as HTMLElement;
      if (!qrCodeElement) {
        console.error('QR code element not found');
        return;
      }

      const svg = qrCodeElement.querySelector('svg');
      if (!svg) {
        console.error('SVG element not found');
        return;
      }

      // Create a canvas to convert SVG to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Create download link
          const link = document.createElement('a');
          link.download = 'slidify-qr-code.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          // Optional: Show success message

        } catch (error) {
          console.error('Error creating download:', error);
        }
      };
      
      img.onerror = () => {
        console.error('Error loading SVG image');
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };


  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        {/* Header */}
        <div className="transition-colors">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex-shrink-0 -mt-56">
                <ThemeToggle />
              </div>

              <div className="text-center flex-1 relative">
                <div className="flex justify-center mb-4">
                  <Lottie path={lottieAnimationUrl} loop autoplay style={{ width: 120, height: 120 }} />
                </div>
                <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Slidify.app
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">{tagline}</p>

                <div className="flex justify-center">
                  {user ? (
                    <div className="flex items-center gap-2">
                      {isPremium && !subscriptionLoading && (
                        <button
                          onClick={() => window.open('https://dashboard.stripe.com/login', '_blank', 'noopener,noreferrer')}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Crown className="w-4 h-4" />
                          Premium
                        </button>
                      )}
                      {!isPremium && !subscriptionLoading && (
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2 text-sm"
                        >
                          <Crown className="w-4 h-4" />
                          Try Premium
                        </button>
                      )}
                      <button
                        onClick={() => setShowUserSettings(true)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={user?.email || ""}
                      >
                        <User className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleLogout}
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

              <div className="flex-shrink-0 w-10" />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-4 space-y-8">
          {/* Upload Images */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Images
            </h2>



            {images.length === 0 ? (
              <>
                <div
                  className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-300">Drag and drop images here, or click to select</p>
                  {!isPremium && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">(Max 10 for free users)</p>}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                </div>


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
                        src={typeof image === "string" ? image : URL.createObjectURL(image)}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-24 object-contain rounded-lg select-none bg-gray-100 dark:bg-gray-600"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {index + 1}
                      </div>
                    </div>
                  ))}

                  {((!isPremium && images.length < 10) || (isPremium && images.length < 100)) && (
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

                  {((!isPremium && images.length >= 10) || (isPremium && images.length >= 100)) && (
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
                            isPremium ? "text-yellow-600 dark:text-yellow-400" : "text-blue-600 dark:text-blue-400"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            isPremium ? "text-yellow-600 dark:text-yellow-400" : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {isPremium ? "Limit reached" : "Upgrade"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>


              </div>
            )}

                        {/* Allow Uploads Toggle - Premium users only */}
            {isPremium && (
              <div className="mt-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowCollaborativeUploadModal(true)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Learn about collaborative uploads"
                  >
                    <HelpCircle size={16} />
                  </button>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">Allow Uploads</span>
                  <button
                    onClick={handleToggleCollaboration}
                    disabled={isCreatingSession}
                    className="relative inline-flex items-center cursor-pointer"
                  >
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        activeUploadSession?.is_active ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                          activeUploadSession?.is_active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </button>
                </div>
                
                {activeUploadSession && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Images uploaded:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {collaborativeImages.length} / {activeUploadSession.max_uploads}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(collaborativeImages.length / activeUploadSession.max_uploads) * 100}%` }}
                      />
                    </div>

                  </div>
                )}

                {/* Share Link and QR Code */}
                {activeUploadSession && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Share this link with others:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={`${window.location.origin}/upload?session=${encodeURIComponent(activeUploadSession.session_token)}`}
                          readOnly
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                        />
                        <button
                          onClick={copyShareLink}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title={copiedLink ? "Copied!" : "Copy link"}
                        >
                          {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                          onClick={() => setShowQrCode(!showQrCode)}
                          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          title={showQrCode ? "Hide QR code" : "Show QR code"}
                        >
                          <QrCode size={16} />
                        </button>
                      </div>
                    </div>

                    {/* QR Code Display */}
                    {showQrCode && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <h4 
                            className="font-semibold text-gray-800 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={downloadQRCode}
                            title="Click to download QR code"
                          >
                            QR Code
                          </h4>
                          <button
                            onClick={() => setShowQrCode(false)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div 
                          className="bg-white p-3 rounded-lg inline-block cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={downloadQRCode}
                          title="Click to download QR code"
                          data-qr-code
                        >
                          <QRCodeSVG
                            value={`${window.location.origin}/upload?session=${encodeURIComponent(activeUploadSession.session_token)}`}
                            size={150}
                            level="M"
                            includeMargin={true}
                          />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Scan this QR code to quickly access the upload page
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* View / Manage Button - Only show when uploads are allowed AND there are images uploaded */}
                {activeUploadSession?.is_active && collaborativeImages.length > 0 && (
                  <div className="mt-4 flex justify-start">
                    <button
                      onClick={() => setShowImageManagementModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all text-sm font-medium"
                    >
                      View / Manage
                    </button>
                  </div>
                )}
              </div>
            )}


            
            {/* Images Section Message Zone */}
            <MessageZone location="images_section" className="mt-3" />
          </div>

          {/* Background Music */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Music className="w-6 h-6 text-blue-600" />
              Background Music
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
                  <Clock size={14} className="text-gray-600 dark:text-gray-300" />
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
                  <p className="text-gray-600 dark:text-gray-300">Choose background music (optional)</p>
                </button>


              </>
            )}
            
            {/* Background Music Section Message Zone */}
            <MessageZone location="music_section" className="mt-6" />
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
                      <Dices size={16} className={isRefreshingData ? "animate-spin" : ""} />
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    min={1}
                    max={10}
                    value={slideDuration}
                    onChange={(e) => setSlideDuration(Number(e.target.value))}
                    id="slide-duration"
                    name="slideDuration"
                    className="w-full"
                  />
                </div>

                <div>
                  <label id="transition-type-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transition Effect
                  </label>
                  <CustomSelect
                    value={transitionType || ""}
                    onChange={setTransitionType}
                    options={transitionOptions}
                    placeholder="Select transition effect"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Settings Section Message Zone */}
            <MessageZone location="settings_section" className="mt-5" />

          </div>

          {/* Preview */}
          {slideshowPreviewImages.length > 0 && (
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
                    slide_urls: slideshowPreviewImages.map((img) => (typeof img === "string" ? img : URL.createObjectURL(img))),
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

          {/* Save Buttons */}
          {user ? (
            // Authenticated users see two buttons
            <div className="flex gap-3">
              <button
                onClick={() => saveSlideshow(false)}
                disabled={isSaving || isCreatingLink || slideshowPreviewImages.length === 0 || !slideshowName.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg font-semibold shadow-lg"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {editingSlideshowId ? "Saving..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingSlideshowId ? "Save Changes" : "Save"}
                  </>
                )}
              </button>
          <button
            onClick={createShareableLink}
            disabled={isSaving || isCreatingLink || slideshowPreviewImages.length === 0 || !slideshowName.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg font-semibold shadow-lg"
          >
            {isCreatingLink ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {editingSlideshowId ? "Saving Changes..." : "Creating Link..."}
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                    {editingSlideshowId ? "Save and Share" : "Save and Share"}
              </>
            )}
          </button>
            </div>
          ) : (
            // Non-authenticated users see single button
            <button
              onClick={createShareableLink}
              disabled={isSaving || isCreatingLink || slideshowPreviewImages.length === 0 || !slideshowName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg font-semibold shadow-lg"
            >
              {isCreatingLink ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating Link...
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Save and Share
                </>
              )}
            </button>
          )}

          {/* Your Slideshows */}
          {user && userSlideshows.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">My Slideshows</h2>
              <div className="space-y-3">
                {userSlideshows.map((slideshow) => (
                  <div key={slideshow.id} className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg transition-colors">
                    <div className="w-full">
                      <h3 className="font-medium text-gray-800 dark:text-white">{slideshow.name}</h3>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow min-w-0">
                          {slideshow.slide_urls.length} slides • Created{" "}
                          {new Date(slideshow.created_at).toLocaleDateString()} at{" "}
                          {new Date(slideshow.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                              onClick={() => setShowCollaborativeUploadModal(true)}
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
                                  setTimeout(() => setCopiedSlideshowId(null), 2000);
                                })
                                .catch(() => {
                                  const textArea = document.createElement("textarea");
                                  textArea.value = url;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand("copy");
                                  document.body.removeChild(textArea);
                                  setCopiedSlideshowId(slideshow.id);
                                  setTimeout(() => setCopiedSlideshowId(null), 2000);
                                });
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Copy share link"
                          >
                            {copiedSlideshowId === slideshow.id ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
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
              <a href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Privacy Policy
              </a>
              <span className="hidden sm:inline">•</span>
              <a href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Terms of Service
              </a>
              <span className="hidden sm:inline">•</span>
              <a href="/release-notes" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Release Notes
              </a>
              <span className="hidden sm:inline">•</span>
              <a href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
              setTimeout(() => setShowConversionModal(true), 300);
            }}
          />
        )}

        {showUserSettings && <UserSettings isOpen={showUserSettings} onClose={handleUserSettingsClose} />}

        {showSuccessModal && (
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            slideshowName={slideshowName}
            shareableLink={shareUrl}
          />
        )}

        {showMusicSelector && (
          <MusicSelector isOpen={showMusicSelector} onClose={() => setShowMusicSelector(false)} onSelectMusic={setSelectedMusic} />
        )}

        {showSlideshowViewer && currentSlideshow && (
          <SlideshowViewer
            slideshowId={currentSlideshow.id}
            initialSlideshow={currentSlideshow}
            onClose={() => setShowSlideshowViewer(false)}
            onEnd={() => setShowEndModal(true)}
          />
        )}

        {showEndModal && <EndSlideshowModal onClose={() => setShowEndModal(false)} />}

        {showDeleteConfirmationModal && slideshowToDelete && (
          <DeleteConfirmationModal
            isOpen={showDeleteConfirmationModal}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            slideshowName={slideshowToDelete.name}
          />
        )}

        {showUpgradeModal && <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />}
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

      {showFeedbackModal && <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />}

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {showCollaborativeUploadModal && (
        <CollaborativeUploadModal
          isOpen={showCollaborativeUploadModal}
          onClose={() => {
            setShowCollaborativeUploadModal(false);
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has("openModal")) {
              urlParams.delete("openModal");
              const newUrl = `${window.location.pathname}${urlParams.toString() ? "?" + urlParams.toString() : ""}`;
              window.history.replaceState({}, document.title, newUrl);
            }
          }}
          onImagesAdded={(newImages) => {
            // Add collaborative images to both images array and slideshow preview
            setImages((prev) => [...prev, ...newImages]);
            setSlideshowPreviewImages((prev) => [...prev, ...newImages]);
          }}
          infoOnly={true}
        />
      )}

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

      {showImageManagementModal && (
        <ImageManagementModal
          isOpen={showImageManagementModal}
          onClose={() => {
            setShowImageManagementModal(false);
            // Only reset to all images if no action was taken
            // Don't reset here since onImagesAdded/onImagesDeleted handle the preview updates
          }}
          images={images}
          slideshowPreviewImages={slideshowPreviewImages}
          collaborativeImages={collaborativeImages}
          onImagesAdded={(selectedImages, hasSelection) => {
            if (hasSelection && selectedImages.length > 0) {
              // Add selected images to both main images array and slideshow preview
              setImages(prev => {
                // Combine existing images with newly selected images
                const combined = [...prev, ...selectedImages];
                // Remove duplicates (in case same image is selected multiple times)
                const unique = combined.filter((image, index, self) => 
                  self.findIndex(img => img === image) === index
                );
                return unique;
              });
              
              setSlideshowPreviewImages(prev => {
                // Combine existing preview images with newly selected images
                const combined = [...prev, ...selectedImages];
                // Remove duplicates (in case same image is selected multiple times)
                const unique = combined.filter((image, index, self) => 
                  self.findIndex(img => img === image) === index
                );
                return unique;
              });
            } else {
              // If no images were selected or selection is empty, show all images in slideshow preview
              setSlideshowPreviewImages(images);
            }
            setShowImageManagementModal(false);
          }}
                      onImagesDeleted={async (selectedImages) => {
              if (collaborativeImages && collaborativeImages.length > 0) {
                // Delete collaborative images from database
                try {
                  const selectedCollaborativeImages = selectedImages.map(img => {
                    const collaborativeImage = collaborativeImages.find(collab => collab.image_url === img);
                    return collaborativeImage;
                  }).filter(Boolean);

                  if (selectedCollaborativeImages.length > 0) {
                    const imageIds = selectedCollaborativeImages.map(img => img!.id);
                    

                    
                    // First, delete from storage if the images exist there
                    for (const collaborativeImage of selectedCollaborativeImages) {
                      if (collaborativeImage.image_url.includes('supabase.co/storage')) {
                        try {
                          const urlParts = collaborativeImage.image_url.split('/');
                          const bucket = urlParts[urlParts.length - 3];
                          const path = urlParts.slice(urlParts.length - 2).join('/');
                          
                          const { error: storageError } = await supabase.storage
                            .from(bucket)
                            .remove([path]);
                          
                          if (storageError) {
                            console.error('Error deleting from storage:', storageError);
                          } else {

                          }
                        } catch (storageError) {
                          console.error('Error deleting from storage:', storageError);
                        }
                      }
                    }
                    
                    // Add a small delay to ensure storage deletion is complete
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Check if we have the required columns for soft delete
                    try {
                      const { data: columnCheck, error: columnError } = await supabase
                        .from('upload_session_images')
                        .select('is_deleted, deleted_at')
                        .limit(1);
                    } catch (e) {
                      // Column check failed
                    }
                    
                    // Then delete from database with retry logic
                    let deleteSuccess = false;
                    let retryCount = 0;
                    const maxRetries = 3;
                    
                    while (!deleteSuccess && retryCount < maxRetries) {
                      // Try to delete one by one to identify which one fails
                      let allDeleted = true;
                      for (const imageId of imageIds) {
                        
                        // First try the standard delete
                        let { error } = await supabase
                          .from('upload_session_images')
                          .delete()
                          .eq('id', imageId);

                        if (error) {
                          console.error(`Standard delete failed for image ${imageId}:`, error);
                          
                          // Try alternative approach - update to mark as deleted
                          const { error: updateError } = await supabase
                            .from('upload_session_images')
                            .update({ 
                              deleted_at: new Date().toISOString(),
                              is_deleted: true 
                            })
                            .eq('id', imageId);
                          
                          if (updateError) {
                            console.error(`Update approach also failed for image ${imageId}:`, updateError);
                            
                            // Try direct SQL as last resort
                            const { error: sqlError } = await supabase
                              .rpc('delete_upload_session_image', { image_id: imageId });
                            
                            if (sqlError) {
                              allDeleted = false;
                            }
                          }
                        }
                      }
                      
                      if (allDeleted) {
                        deleteSuccess = true;
                      } else {
                        retryCount++;
                        if (retryCount < maxRetries) {
                          // Wait before retry
                          await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
                        }
                      }
                    }
                    
                    if (deleteSuccess) {
                      // Update local state immediately
                      setCollaborativeImages(prev => 
                        prev.filter(img => !imageIds.includes(img.id))
                      );
                      
                      // Update preview to reflect the deletion
                      setSlideshowPreviewImages(prev => 
                        prev.filter(img => !selectedImages.includes(img))
                      );
                      

                      
                      // Verify deletion by checking if images still exist in database
                      await new Promise(resolve => setTimeout(resolve, 200));
                      
                      // Check what's still in the database
                      const { data: verifyData, error: verifyError } = await supabase
                        .from('upload_session_images')
                        .select('*')
                        .in('id', imageIds);
                      
                      if (verifyError) {
                        console.error('Error verifying deletion:', verifyError);
                      } else if (verifyData && verifyData.length > 0) {
                        console.warn('Some images still exist in database after deletion:', verifyData);
                        console.warn('This suggests a database constraint or policy issue');
                        
                        // Try to understand why deletion failed
                        for (const remainingImage of verifyData) {
                          // Remaining image details logged for debugging
                        }
                        
                        // Force reload to sync with actual database state
                        if (activeUploadSession) {
                          await loadCollaborativeImages(activeUploadSession.id);
                        }
                      } else {

                      }
                    } else {
                      console.error('Failed to delete images from database after all retries');
                      // Don't update local state if database deletion failed
                      return;
                    }
                  }
                } catch (error) {
                  console.error('Error deleting collaborative images:', error);
                }
              } else {
                // Delete local images from main array
                const selectedIndices = selectedImages.map(img => images.indexOf(img)).filter(idx => idx !== -1);
                setImages(prev => prev.filter((_, index) => !selectedIndices.includes(index)));
                // Update preview to reflect the deletion
                setSlideshowPreviewImages(prev => prev.filter((_, index) => !selectedIndices.includes(index)));
              }
              setShowImageManagementModal(false);
            }}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Text</label>
        <input
          type="text"
          value={editMessage}
          onChange={(e) => setEditMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription Type</label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
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
          className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-4 h-4 inline mr-2" />
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