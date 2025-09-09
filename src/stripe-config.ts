export const STRIPE_PRODUCTS = {
  MONTHLY_SUBSCRIPTION: {
    id: 'prod_SlVtPOFj6ip0Gu',
    priceId: 'price_1RpyrH02ikQ3kOyU5heMXV8V',
    name: 'Slidify Premium Monthly',
    description: 'Slidify.app monthly subscription',
    mode: 'subscription' as const,
    price: 499, // $4.99 in cents
    interval: 'month' as const,
  }
} as const;

export type StripeProduct = typeof STRIPE_PRODUCTS[keyof typeof STRIPE_PRODUCTS];