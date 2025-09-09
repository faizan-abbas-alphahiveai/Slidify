import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PRODUCTS } from '../stripe-config';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export { stripePromise };
export { STRIPE_PRODUCTS };

export const createCheckoutSession = async (priceId: string, userToken: string, userId?: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: `${window.location.origin}?payment=success`,
        cancel_url: `${window.location.origin}?payment=cancelled`,
        mode: 'subscription'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();
    
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    // Use the URL from the response if available, otherwise use redirectToCheckout
    if (url) {
      window.location.href = url;
    } else {
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};