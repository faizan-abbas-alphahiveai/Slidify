import React, { useState } from 'react';
import { X, Crown, Check, Loader2, CheckCircle } from 'lucide-react';
import { createCheckoutSession } from '../lib/stripe';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPremiumCheckout = async () => {
    if (!user) {
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
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
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;


  const features = [
    'Up to 100 photos in slideshows',
    'Access to full music library',
    'Upload custom audio',
    'Record voiceovers (coming soon)',
    'Edit existing slideshows',
    'Slideshow analytics',
    'Priority customer support'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full">
                <Crown className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Upgrade to Premium
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Coming Soon Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-center transition-colors">
            <h3 className="text-base font-semibold text-blue-800 dark:text-blue-300">
              Premium Features Now Available!
            </h3>
          </div>

          {/* Pricing */}
          <div className="text-center">
            <div className="mb-3">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">$4.99</span>
              <span className="text-gray-600 dark:text-gray-300 ml-2">/month</span>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-full text-sm font-medium inline-block mb-3">
              First month free!
            </div>
          </div>

          {/* Features */}
          <div className="-mt-1">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-2">What you'll get:</h3>
            <div className="grid grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0">
                    <Check className="text-green-600 dark:text-green-400" size={10} />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Button */}
          <div className="space-y-3">
            {!user && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300 text-xs">
                Please sign in to upgrade to premium features.
              </div>
            )}
            
            <button
              onClick={handleStartPremiumCheckout}
              disabled={isLoading || !user}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting checkout...
                </>
              ) : (
                <>
                  <Crown size={16} />
                  {user ? 'Start Premium Subscription' : 'Sign In to Upgrade'}
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Cancel anytime • Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}