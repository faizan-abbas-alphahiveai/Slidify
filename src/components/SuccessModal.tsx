import React, { useState } from 'react';
import { X, Copy, Check, Share2, Facebook, MessageCircle, Mail, UserPlus, SquareUserRound, Heart, Star, Sparkles, Gift, Trophy, Zap, CheckCircle, ThumbsUp, Smile, PartyPopper, Clapperboard, Film, Users, Camera, Video, Mic, PlayCircle, Megaphone, Flame, Eye, ChefHat, Wand2, Crown, Pizza, Send, User, Share } from 'lucide-react';
import { getRandomShareMessage, recordSlideshowShare } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useSubscription } from '../lib/subscription';
import AuthModal from './AuthModal';

// Icon mapping for dynamic icon rendering
const iconMap = {
  SquareUserRound,
  Heart,
  Star,
  Sparkles,
  Gift,
  Trophy,
  Zap,
  CheckCircle,
  ThumbsUp,
  Smile,
  PartyPopper,
  Clapperboard,
  Film,
  Users,
  Camera,
  Video,
  Mic,
  PlayCircle,
  Megaphone,
  Flame,
  Eye,
  ChefHat,
  Wand2,
  Crown,
  Pizza,
  Send,
  User,
  Share
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideshowName: string;
  shareableLink: string;
  slideshowId?: string;
}

export default function SuccessModal({ isOpen, onClose, slideshowName, shareableLink, slideshowId }: SuccessModalProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState('Your slideshow is ready to share with the world!');
  const [iconName, setIconName] = useState('SquareUserRound');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load random share message when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const loadShareMessage = async () => {
        try {
          const randomMessage = await getRandomShareMessage();
          const messageData = JSON.parse(randomMessage);
          setShareMessage(messageData.message);
          setIconName(messageData.icon_name);
        } catch (error) {
          console.error('Error loading share message:', error);
          // Keep default message if loading fails
        }
      };
      loadShareMessage();
    }
  }, [isOpen]);

  // Get the icon component dynamically
  const IconComponent = iconMap[iconName as keyof typeof iconMap] || SquareUserRound;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Track the copy action
      if (slideshowId) {
        await recordSlideshowShare(slideshowId, 'copy');
      }
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Track the copy action
      if (slideshowId) {
        await recordSlideshowShare(slideshowId, 'copy');
      }
    }
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}`;
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
    
    // Track the Facebook share
    if (slideshowId) {
      recordSlideshowShare(slideshowId, 'facebook');
    }
  };

  const shareOnTwitter = () => {
    const text = `Check out the slideshow I created on Slidify!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
    
    // Track the Twitter share
    if (slideshowId) {
      recordSlideshowShare(slideshowId, 'twitter');
    }
  };

  const shareOnWhatsApp = () => {
    const text = `Just saw this slideshow and thought you might be interested:
View it here: ${shareableLink}
Created with Slidify - the easy way to create beautiful shareable slideshows.

Slidify.app - Beautiful shareable slideshows`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    // Track the WhatsApp share
    if (slideshowId) {
      recordSlideshowShare(slideshowId, 'whatsapp');
    }
  };

  const shareViaEmail = () => {
    const subject = `Check out the slideshow I created on Slidify!`;
    const body = `I created a slideshow and wanted to share it with you!\n\nView it here: ${shareableLink}\n\nCreated with Slidify - the easy way to create beautiful audio slideshows.`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
    
    // Track the email share
    if (slideshowId) {
      recordSlideshowShare(slideshowId, 'email');
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setIsUpgrading(true);
      
      // Get the current session to retrieve the access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Unable to authenticate. Please try signing in again.');
      }
      
      await createCheckoutSession(
        STRIPE_PRODUCTS.MONTHLY_SUBSCRIPTION.priceId,
        session.access_token
      );
    } catch (error) {
      console.error('Error starting checkout:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <IconComponent className="text-blue-600 flex-shrink-0" size={70} />
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">{shareMessage}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Share This Slideshow */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Share this slideshow
            </h3>
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1"
                title={copied ? "Copied!" : "Copy link"}
              >
                {copied ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
              <button
                onClick={shareOnFacebook}
                className="flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
                title="Share on Facebook"
              >
                <Facebook size={16} />
              </button>
              <button
                onClick={shareOnTwitter}
                className="flex items-center justify-center p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex-1"
                title="Share on X (Twitter)"
              >
                <X size={16} />
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="flex items-center justify-center p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex-1"
                title="Share on WhatsApp"
              >
                <MessageCircle size={16} />
              </button>
              <button
                onClick={shareViaEmail}
                className="flex items-center justify-center p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex-1"
                title="Share via Email"
              >
                <Mail size={16} />
              </button>
            </div>
          </div>


          
          {/* Enjoying Slidify Section - Only show if not premium */}
          {!isPremium && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Enjoying Slidify?
              </h3>
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 mb-2"
                title="Upgrade to premium features"
              >
                {isUpgrading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Starting checkout...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    {user ? 'Upgrade to Premium' : 'Sign Up'}
                  </>
                )}
              </button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                ${(STRIPE_PRODUCTS.MONTHLY_SUBSCRIPTION.price / 100).toFixed(2)} per month (first month free!)
              </p>
            </div>
          )}
          

          {/* Simple donation link */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              or make a{' '}
              <a
                href="https://buymeacoffee.com/slidifyapp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
              >
                one-time donation
              </a>
            </p>
          </div>
        </div>

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