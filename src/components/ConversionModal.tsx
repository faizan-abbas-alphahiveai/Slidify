import React from 'react';
import { X, Upload, Music, Mic, Edit, BarChart3, UserPlus, Star, Crown } from 'lucide-react';
import { createCheckoutSession } from '../lib/stripe';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
}

export default function ConversionModal({ isOpen, onClose, onSignUp }: ConversionModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      onSignUp();
      return;
    }

    try {
      setIsLoading(true);
      
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
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const benefits = [
    {
      icon: Upload,
      title: 'Upload more photos',
      description: 'No limits on the number of images in your slideshows'
    },
    {
      icon: Music,
      title: 'More music choices',
      description: 'Access our full library of background music tracks'
    },
    {
      icon: Mic,
      title: 'Add your own audio',
      description: 'Upload custom music or record voiceovers for your slideshows'
    },
    {
      icon: Edit,
      title: 'Edit existing slideshows',
      description: 'Make changes to your slideshows anytime after creating them'
    },
    {
      icon: BarChart3,
      title: 'Data on your views and re-shares',
      description: 'Track how many people view and share your slideshows'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Crown className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Unlock Premium Features
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar">
          <div className="p-6 space-y-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-300 text-xl mb-2">
              Take your slideshows to the next level!
            </p>
          </div>

          {/* Pricing Box - Now clickable */}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6 text-center transition-all cursor-pointer hover:shadow-xl hover:scale-[1.01] hover:border-blue-300 dark:hover:border-blue-600 -mt-4"
          >
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">${(STRIPE_PRODUCTS.MONTHLY_SUBSCRIPTION.price / 100).toFixed(2)}</span>
              <span className="text-gray-600 dark:text-gray-300 ml-2">per month</span>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium inline-block mb-2">
              First month free!
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Cancel anytime • No long-term commitment
            </p>
          </button>

          {/* Benefits List */}
          <div className="space-y-4 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <benefit.icon className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Starting checkout...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  {user ? 'Start Free Trial' : 'Sign-up for free trial'}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors text-sm text-center"
            >
              Maybe later
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Join thousands of users creating beautiful slideshows with Slidify
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}