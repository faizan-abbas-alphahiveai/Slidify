import React, { useState } from 'react';
import { Share2, Facebook, MessageCircle, Heart, ExternalLink, Copy, Check, Mail, X } from 'lucide-react';
import { recordSlideshowShare } from '../lib/supabase';

interface EndSlideshowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  slideshowName: string;
  slideshowMessage?: string;
  shareableLink: string;
  slideshowId?: string;
}

export default function EndSlideshowModal({ 
  isOpen, 
  onClose, 
  onRestart, 
  slideshowName, 
  slideshowMessage,
  shareableLink,
  slideshowId
}: EndSlideshowModalProps) {
  const [copied, setCopied] = useState(false);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Thanks for watching!</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Slideshow Info */}
          <div className="text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3 transition-colors">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                <span className="font-bold">{slideshowName}</span>
                {slideshowMessage && (
                  <>
                    <br />
                    <span className="mt-1 block">{slideshowMessage}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRestart}
              className="flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1"
            >
              <Copy size={14} />
              Watch Again
            </button>
            <a
              href="https://slidify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex-1"
            >
              Try Slidify
            </a>
          </div>

          {/* Share This Slideshow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Share this slideshow
            </label>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1"
                title={copied ? "Copied!" : "Copy link"}
              >
                {copied ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <button
                onClick={shareOnFacebook}
                className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
                title="Share on Facebook"
              >
                <Facebook size={14} />
              </button>
              <button
                onClick={shareOnTwitter}
                className="flex items-center justify-center p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex-1"
                title="Share on X (Twitter)"
              >
                <X size={14} />
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="flex items-center justify-center p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex-1"
                title="Share on WhatsApp"
              >
                <MessageCircle size={14} />
              </button>
              <button
                onClick={shareViaEmail}
                className="flex items-center justify-center p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex-1"
                title="Share via Email"
              >
                <Mail size={14} />
              </button>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 transition-colors">
            <div className="text-center">
              <Heart className="mx-auto text-red-500 mb-2" size={20} />
              <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Support Slidify</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Help us keep creating amazing tools for everyone!
              </p>
              
              <div className="flex justify-center">
                <a
                  href="https://buymeacoffee.com/slidifyapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm whitespace-nowrap"
                >
                  Buy Me a Coffee
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}