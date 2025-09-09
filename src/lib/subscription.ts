import { supabase } from './supabase';
import { useAuth } from './auth';
import { useState, useEffect } from 'react';
import { STRIPE_PRODUCTS } from '../stripe-config';

export interface StripeSubscription {
  id: string;
  customer_id: string;
  subscription_id: string | null;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  subscription_status: string;
}

export const getUserSubscription = async (): Promise<StripeSubscription | null> => {
  try {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching user subscription:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
};

export const isUserPremium = (subscription: StripeSubscription | null): boolean => {
  if (!subscription) return false;
  
  const activeStatuses = ['active', 'trialing', 'past_due'];
  return activeStatuses.includes(subscription.subscription_status);
};

export const getSubscriptionProductName = (subscription: StripeSubscription | null): string => {
  if (!subscription || !subscription.price_id) return '';
  
  // Find the product that matches the price_id
  const product = Object.values(STRIPE_PRODUCTS).find(p => p.priceId === subscription.price_id);
  return product?.name || 'Premium Plan';
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        const userSubscription = await getUserSubscription();
        setSubscription(userSubscription);
        setIsPremium(isUserPremium(userSubscription));
      } catch (error) {
        console.error('Error loading subscription:', error);
        setSubscription(null);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();

    // Set up real-time subscription to subscription changes  
    const subscription_channel = supabase
      .channel('stripe_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stripe_subscriptions',
        },
        (payload) => {
      
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      subscription_channel.unsubscribe();
    };
  }, [user]);

  return {
    subscription,
    isPremium,
    isLoading,
    productName: getSubscriptionProductName(subscription),
    refreshSubscription: async () => {
      if (user) {
        const userSubscription = await getUserSubscription();
        setSubscription(userSubscription);
        setIsPremium(isUserPremium(userSubscription));
      }
    }
  };
};