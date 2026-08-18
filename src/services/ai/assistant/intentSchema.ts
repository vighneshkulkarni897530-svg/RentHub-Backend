// ============================================================
// RentHub AI Assistant - Strict Intent Schema
// ============================================================
// The AI model must return structured JSON matching this schema.
// The backend validates strictly before executing any tool.
// ============================================================

export const AI_INTENTS = [
  'GENERAL_HELP',
  'SEARCH_PRODUCTS',
  'VIEW_PRODUCT',
  'RENT_PRODUCT',
  'BUY_PRODUCT',
  'ASK_OWNER_TO_BUY',
  'CHECK_AVAILABILITY',
  'VIEW_CATEGORIES',
  'VIEW_MY_RENTALS',
  'VIEW_MY_PURCHASES',
  'VIEW_WISHLIST',
  'VIEW_NOTIFICATIONS',
  'VIEW_MESSAGES',
  'VIEW_PROFILE',
  'VIEW_WALLET',
  'VIEW_REVIEWS',
  'VIEW_OWNER_DASHBOARD',
  'VIEW_OWNER_LISTINGS',
  'ADD_LISTING',
  'EDIT_LISTING',
  'VIEW_BOOKING_REQUESTS',
  'VIEW_PURCHASE_REQUESTS',
  'VIEW_OWNER_SALES',
  'VIEW_EARNINGS',
  'VIEW_ADMIN_DASHBOARD',
  'VIEW_HELP',
  'TRACK_RENTAL',
  'CHECK_DEPOSIT',
  'CHECK_DELIVERY',
  'CHECK_PICKUP',
  'CANCEL_ACTION',
  'UNKNOWN',
] as const;

export type AIIntent = (typeof AI_INTENTS)[number];

export const PRICE_UNITS = ['hour', 'day', 'week', 'month'] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export const FULFILLMENT_METHODS = ['delivery', 'pickup'] as const;
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number];

export const SORT_OPTIONS = ['relevance', 'newest', 'rating', 'price_asc', 'price_desc'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface AIAssistantIntent {
  intent: AIIntent;
  category?: string | null;
  product?: string | null;
  query?: string | null;
  mode?: 'rent' | 'buy' | null;
  maxPrice?: number | null;
  minPrice?: number | null;
  priceUnit?: PriceUnit | null;
  duration?: number | null;
  location?: string | null;
  fulfillmentMethod?: FulfillmentMethod | null;
  sort?: SortOption | null;
  requiresLogin?: boolean;
  requiresConfirmation?: boolean;
  message?: string | null;
}

/**
 * Validate that an unknown object is a valid AIAssistantIntent.
 * Returns the normalized intent or null if invalid.
 */
export function validateAIIntent(raw: unknown): AIAssistantIntent | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const intent = String(obj.intent || 'UNKNOWN').toUpperCase();
  if (!AI_INTENTS.includes(intent as AIIntent)) return null;

  const priceUnit = obj.priceUnit ? String(obj.priceUnit).toLowerCase() : null;
  if (priceUnit && !PRICE_UNITS.includes(priceUnit as PriceUnit)) return null;

  const fulfillmentMethod = obj.fulfillmentMethod ? String(obj.fulfillmentMethod).toLowerCase() : null;
  if (fulfillmentMethod && !FULFILLMENT_METHODS.includes(fulfillmentMethod as FulfillmentMethod)) return null;

  const sort = obj.sort ? String(obj.sort).toLowerCase() : null;
  if (sort && !SORT_OPTIONS.includes(sort as SortOption)) return null;

  const maxPrice = obj.maxPrice != null ? Number(obj.maxPrice) : null;
  const minPrice = obj.minPrice != null ? Number(obj.minPrice) : null;
  const duration = obj.duration != null ? Number(obj.duration) : null;

  return {
    intent: intent as AIIntent,
    category: obj.category ? String(obj.category) : null,
    product: obj.product ? String(obj.product) : null,
    query: obj.query ? String(obj.query) : null,
    mode: obj.mode === 'buy' ? 'buy' : obj.mode === 'rent' ? 'rent' : null,
    maxPrice: maxPrice != null && !isNaN(maxPrice) && maxPrice > 0 ? maxPrice : null,
    minPrice: minPrice != null && !isNaN(minPrice) && minPrice > 0 ? minPrice : null,
    priceUnit: (priceUnit as PriceUnit) || null,
    duration: duration != null && !isNaN(duration) && duration > 0 ? Math.floor(duration) : null,
    location: obj.location ? String(obj.location) : null,
    fulfillmentMethod: (fulfillmentMethod as FulfillmentMethod) || null,
    sort: (sort as SortOption) || null,
    requiresLogin: !!obj.requiresLogin,
    requiresConfirmation: !!obj.requiresConfirmation,
    message: obj.message ? String(obj.message) : null,
  };
}