// ============================================================
// RentHub AI Assistant - Controlled Tool Layer
// ============================================================
// Only these explicit functions are exposed to the AI.
// The AI can never call arbitrary backend functions.
// ============================================================

import ProductService from '../../product.service';
import CategoryRepository from '../../../repositories/CategoryRepository';
import BookingRepository from '../../../repositories/BookingRepository';
import PurchaseRepository from '../../../repositories/PurchaseRepository';
import NotificationRepository from '../../../repositories/NotificationRepository';
import { AIAssistantIntent } from './intentSchema';
import { UserRole } from '../../../models/User';

export interface ToolContext {
  userId?: string;
  userRole?: UserRole;
  isAuthenticated: boolean;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  navigation?: {
    type: 'SEARCH' | 'PRODUCT' | 'PAGE' | 'LOGIN' | 'NONE';
    url?: string;
    productId?: string;
  };
}

// ---------- Navigation URL helpers ----------
function buildSearchUrl(intent: AIAssistantIntent): string {
  const params = new URLSearchParams();
  if (intent.query) params.set('q', intent.query);
  if (intent.category) params.set('category', intent.category);
  if (intent.location) params.set('location', intent.location);
  if (intent.maxPrice != null) params.set('maxPrice', String(intent.maxPrice));
  if (intent.minPrice != null) params.set('minPrice', String(intent.minPrice));
  if (intent.sort) params.set('sort', intent.sort);
  const qs = params.toString();
  return qs ? `/public/search?${qs}` : '/public/search';
}

// ---------- Role-based page mapping ----------
const PAGE_MAP: Record<string, { url: string; roles?: UserRole[] }> = {
  VIEW_MY_RENTALS: { url: '/dashboard/my-rentals', roles: ['customer', 'owner', 'admin'] },
  VIEW_MY_PURCHASES: { url: '/dashboard/my-purchases', roles: ['customer', 'owner', 'admin'] },
  VIEW_WISHLIST: { url: '/dashboard/wishlist', roles: ['customer', 'owner', 'admin'] },
  VIEW_NOTIFICATIONS: { url: '/dashboard/notifications', roles: ['customer', 'owner', 'admin'] },
  VIEW_MESSAGES: { url: '/dashboard/messages', roles: ['customer', 'owner', 'admin'] },
  VIEW_PROFILE: { url: '/dashboard/profile', roles: ['customer', 'owner', 'admin'] },
  VIEW_WALLET: { url: '/dashboard/wallet', roles: ['customer', 'owner', 'admin'] },
  VIEW_REVIEWS: { url: '/dashboard/reviews', roles: ['customer', 'owner', 'admin'] },
  VIEW_OWNER_DASHBOARD: { url: '/owner/dashboard', roles: ['owner', 'admin'] },
  VIEW_OWNER_LISTINGS: { url: '/owner/listings', roles: ['owner', 'admin'] },
  ADD_LISTING: { url: '/owner/add-item', roles: ['owner', 'admin'] },
  EDIT_LISTING: { url: '/owner/listings', roles: ['owner', 'admin'] },
  VIEW_BOOKING_REQUESTS: { url: '/owner/booking-requests', roles: ['owner', 'admin'] },
  VIEW_PURCHASE_REQUESTS: { url: '/owner/purchase-requests', roles: ['owner', 'admin'] },
  VIEW_OWNER_SALES: { url: '/owner/sales', roles: ['owner', 'admin'] },
  VIEW_EARNINGS: { url: '/owner/earnings', roles: ['owner', 'admin'] },
  VIEW_ADMIN_DASHBOARD: { url: '/admin/dashboard', roles: ['admin'] },
  VIEW_HELP: { url: '/help', roles: ['customer', 'owner', 'admin'] },
  VIEW_CATEGORIES: { url: '/public/categories', roles: ['customer', 'owner', 'admin'] },
  GENERAL_HELP: { url: '/help', roles: ['customer', 'owner', 'admin'] },
};

// ---------- Tool implementations ----------

async function searchProducts(intent: AIAssistantIntent, _ctx: ToolContext): Promise<ToolResult> {
  const filters: Record<string, unknown> = { page: 1, limit: 12, sort: intent.sort || 'relevance' };
  if (intent.query) filters.search = intent.query;
  if (intent.category) filters.category = intent.category;
  if (intent.location) filters.location = intent.location;
  if (intent.maxPrice != null) filters.maxPrice = intent.maxPrice;
  if (intent.minPrice != null) filters.minPrice = intent.minPrice;

  const result = await ProductService.listProducts(filters);
  const products = result?.data ?? [];
  const count = Array.isArray(products) ? products.length : 0;

  const message =
    count > 0
      ? `I found ${count} matching product${count !== 1 ? 's' : ''}.`
      : 'I could not find any products matching your request. Try adjusting your filters.';

  return {
    success: true,
    message,
    data: { products, total: result?.total ?? count },
    navigation: { type: 'SEARCH', url: buildSearchUrl(intent) },
  };
}

async function getProduct(intent: AIAssistantIntent, _ctx: ToolContext): Promise<ToolResult> {
  const query = intent.product || intent.query;
  if (!query) {
    return { success: false, message: 'Please tell me which product you are looking for.' };
  }
  const result = await ProductService.listProducts({ search: query, page: 1, limit: 5 });
  const products = result?.data ?? [];
  if (!Array.isArray(products) || products.length === 0) {
    return { success: false, message: `I could not find "${query}" on RentHub.`, navigation: { type: 'SEARCH', url: buildSearchUrl(intent) } };
  }
  const product = products[0];
  const slug = product.slug || product._id;
  return {
    success: true,
    message: `I found ${product.title}.`,
    data: { product },
    navigation: { type: 'PRODUCT', url: `/public/product/${slug}`, productId: product._id?.toString?.() || product.id },
  };
}

async function getCategories(_intent: AIAssistantIntent, _ctx: ToolContext): Promise<ToolResult> {
  const categories = await CategoryRepository.listActive();
  return {
    success: true,
    message: `RentHub has ${categories.length} categories.`,
    data: { categories },
    navigation: { type: 'PAGE', url: '/public/categories' },
  };
}

async function checkAvailability(intent: AIAssistantIntent, _ctx: ToolContext): Promise<ToolResult> {
  const query = intent.product || intent.query;
  if (!query) {
    return { success: false, message: 'Please tell me which product you want to check availability for.' };
  }
  const result = await ProductService.listProducts({ search: query, page: 1, limit: 1 });
  const products = result?.data ?? [];
  if (!Array.isArray(products) || products.length === 0) {
    return { success: false, message: `I could not find "${query}" to check availability.` };
  }
  const product = products[0];
  const status = product.productStatus || 'available';
  const slug = product.slug || product._id;
  return {
    success: true,
    message: `${product.title} is currently ${status}.`,
    data: { product, status },
    navigation: { type: 'PRODUCT', url: `/public/product/${slug}`, productId: product._id?.toString?.() || product.id },
  };
}

async function getMyRentals(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return { success: false, message: 'You need to log in before viewing your rentals.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  const bookings = await BookingRepository.find({ renter: ctx.userId as any }, { sort: { createdAt: -1 as 1 | -1 }, limit: 20 });
  return {
    success: true,
    message: `You have ${bookings.length} rental booking${bookings.length !== 1 ? 's' : ''}.`,
    data: { bookings },
    navigation: { type: 'PAGE', url: '/dashboard/my-rentals' },
  };
}

async function getMyPurchases(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return { success: false, message: 'You need to log in before viewing your purchases.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  const purchases = await PurchaseRepository.find({ buyer: ctx.userId as any }, { sort: { createdAt: -1 as 1 | -1 }, limit: 20 });
  return {
    success: true,
    message: `You have ${purchases.length} purchase${purchases.length !== 1 ? 's' : ''}.`,
    data: { purchases },
    navigation: { type: 'PAGE', url: '/dashboard/my-purchases' },
  };
}

async function getMyNotifications(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return { success: false, message: 'You need to log in before viewing your notifications.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  const notifications = await NotificationRepository.find({ user: ctx.userId as any }, { sort: { createdAt: -1 as 1 | -1 }, limit: 20 });
  return {
    success: true,
    message: `You have ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}.`,
    data: { notifications },
    navigation: { type: 'PAGE', url: '/dashboard/notifications' },
  };
}

async function getOwnerListings(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return { success: false, message: 'You need to log in before viewing your listings.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
    return { success: false, message: 'Only owners can view listings. Please switch to an owner account.' };
  }
  const products = await ProductService.getOwnerProducts(ctx.userId);
  return {
    success: true,
    message: `You have ${products.length} listing${products.length !== 1 ? 's' : ''}.`,
    data: { products },
    navigation: { type: 'PAGE', url: '/owner/listings' },
  };
}

async function getOwnerSales(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return { success: false, message: 'You need to log in before viewing your sales.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
    return { success: false, message: 'Only owners can view sales. Please switch to an owner account.' };
  }
  const sales = await PurchaseRepository.find({ owner: ctx.userId as any }, { sort: { createdAt: -1 as 1 | -1 }, limit: 20 });
  return {
    success: true,
    message: `You have ${sales.length} sale${sales.length !== 1 ? 's' : ''}.`,
    data: { sales },
    navigation: { type: 'PAGE', url: '/owner/sales' },
  };
}

async function getOwnerEarnings(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return { success: false, message: 'You need to log in before viewing your earnings.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
    return { success: false, message: 'Only owners can view earnings. Please switch to an owner account.' };
  }
  return { success: true, message: 'Here are your earnings.', navigation: { type: 'PAGE', url: '/owner/earnings' } };
}

async function getBookingRequests(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return { success: false, message: 'You need to log in before viewing booking requests.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
    return { success: false, message: 'Only owners can view booking requests.' };
  }
  return { success: true, message: 'Here are your booking requests.', navigation: { type: 'PAGE', url: '/owner/booking-requests' } };
}

async function getPurchaseRequests(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return { success: false, message: 'You need to log in before viewing purchase requests.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
    return { success: false, message: 'Only owners can view purchase requests.' };
  }
  return { success: true, message: 'Here are your purchase requests.', navigation: { type: 'PAGE', url: '/owner/purchase-requests' } };
}

async function navigateToPage(intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  const page = PAGE_MAP[intent.intent];
  if (!page) {
    return { success: false, message: 'I am not sure where to take you for that request.' };
  }
  if (page.roles && !page.roles.includes(ctx.userRole || 'customer')) {
    return { success: false, message: 'You do not have permission to access that page.', navigation: { type: 'PAGE', url: '/help' } };
  }
  if (!ctx.isAuthenticated && page.roles) {
    return { success: false, message: 'You need to log in before accessing that page.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  return { success: true, message: `Taking you to ${page.url}.`, navigation: { type: 'PAGE', url: page.url } };
}

async function handleRentProduct(intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before renting an item.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  const query = intent.product || intent.query;
  if (!query) {
    return { success: false, message: 'Please tell me which product you want to rent.' };
  }
  const result = await ProductService.listProducts({ search: query, page: 1, limit: 1 });
  const products = result?.data ?? [];
  if (!Array.isArray(products) || products.length === 0) {
    return { success: false, message: `I could not find "${query}" to rent.` };
  }
  const product = products[0];
  const slug = product.slug || product._id;
  return {
    success: true,
    message: `I found ${product.title}. I'll take you to the booking page where you can confirm the rental.`,
    data: { product },
    navigation: { type: 'PRODUCT', url: `/public/product/${slug}`, productId: product._id?.toString?.() || product.id },
  };
}

async function handleBuyProduct(intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before buying an item.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  const query = intent.product || intent.query;
  if (!query) {
    return { success: false, message: 'Please tell me which product you want to buy.' };
  }
  const result = await ProductService.listProducts({ search: query, page: 1, limit: 1 });
  const products = result?.data ?? [];
  if (!Array.isArray(products) || products.length === 0) {
    return { success: false, message: `I could not find "${query}" to buy.` };
  }
  const product = products[0];
  const slug = product.slug || product._id;
  return {
    success: true,
    message: `I found ${product.title}. I'll take you to the purchase page where you can confirm the purchase.`,
    data: { product },
    navigation: { type: 'PRODUCT', url: `/public/product/${slug}`, productId: product._id?.toString?.() || product.id },
  };
}

async function handleAskOwnerToBuy(intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before asking an owner to buy an item.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  const query = intent.product || intent.query;
  if (!query) {
    return { success: false, message: 'Please tell me which product you want to buy from the owner.' };
  }
  const result = await ProductService.listProducts({ search: query, page: 1, limit: 1 });
  const products = result?.data ?? [];
  if (!Array.isArray(products) || products.length === 0) {
    return { success: false, message: `I could not find "${query}".` };
  }
  const product = products[0];
  const slug = product.slug || product._id;
  return {
    success: true,
    message: `I found ${product.title}. I'll take you to the product page where you can request to buy it from the owner.`,
    data: { product },
    navigation: { type: 'PRODUCT', url: `/public/product/${slug}`, productId: product._id?.toString?.() || product.id },
  };
}

async function handleAddListing(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before listing an item.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
    return { success: false, message: 'Only owners can list items. Please switch to an owner account.' };
  }
  return { success: true, message: 'I\'ll take you to the add-item page. You can fill in the details and submit for review.', navigation: { type: 'PAGE', url: '/owner/add-item' } };
}

async function handleEditListing(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before editing a listing.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  if (ctx.userRole !== 'owner' && ctx.userRole !== 'admin') {
    return { success: false, message: 'Only owners can edit listings. Please switch to an owner account.' };
  }
  return { success: true, message: 'I\'ll take you to your listings where you can edit an item.', navigation: { type: 'PAGE', url: '/owner/listings' } };
}

async function handleTrackRental(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before tracking a rental.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  return { success: true, message: 'I\'ll take you to your rentals where you can track the status.', navigation: { type: 'PAGE', url: '/dashboard/my-rentals' } };
}

async function handleCheckDeposit(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before checking your deposit.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  return { success: true, message: 'I\'ll take you to your wallet where you can check your deposit status.', navigation: { type: 'PAGE', url: '/dashboard/wallet' } };
}

async function handleCheckDelivery(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before checking delivery status.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  return { success: true, message: 'I\'ll take you to your rentals to check delivery status.', navigation: { type: 'PAGE', url: '/dashboard/my-rentals' } };
}

async function handleCheckPickup(_intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.isAuthenticated) {
    return { success: false, message: 'You need to log in before checking pickup status.', navigation: { type: 'LOGIN', url: '/auth/login' } };
  }
  return { success: true, message: 'I\'ll take you to your rentals to check pickup status.', navigation: { type: 'PAGE', url: '/dashboard/my-rentals' } };
}

async function handleGeneralHelp(_intent: AIAssistantIntent, _ctx: ToolContext): Promise<ToolResult> {
  return {
    success: true,
    message: 'I can help you find products to rent or buy, check availability, manage your account, and navigate RentHub. Try asking "Show me cameras under ₹800 per day" or "Show my rentals".',
    navigation: { type: 'PAGE', url: '/help' },
  };
}

async function handleUnknown(intent: AIAssistantIntent, _ctx: ToolContext): Promise<ToolResult> {
  return {
    success: true,
    message: intent.message || 'I\'m not sure I understood that. Could you rephrase? For example: "Show me cameras under ₹800 per day" or "Show my rentals".',
    navigation: { type: 'NONE' },
  };
}

// ---------- Intent → Tool dispatch (allowlist) ----------
const TOOL_DISPATCH: Record<string, (intent: AIAssistantIntent, ctx: ToolContext) => Promise<ToolResult>> = {
  SEARCH_PRODUCTS: searchProducts,
  VIEW_PRODUCT: getProduct,
  RENT_PRODUCT: handleRentProduct,
  BUY_PRODUCT: handleBuyProduct,
  ASK_OWNER_TO_BUY: handleAskOwnerToBuy,
  CHECK_AVAILABILITY: checkAvailability,
  VIEW_CATEGORIES: getCategories,
  VIEW_MY_RENTALS: getMyRentals,
  VIEW_MY_PURCHASES: getMyPurchases,
  VIEW_NOTIFICATIONS: getMyNotifications,
  VIEW_OWNER_LISTINGS: getOwnerListings,
  VIEW_OWNER_SALES: getOwnerSales,
  VIEW_EARNINGS: getOwnerEarnings,
  VIEW_BOOKING_REQUESTS: getBookingRequests,
  VIEW_PURCHASE_REQUESTS: getPurchaseRequests,
  ADD_LISTING: handleAddListing,
  EDIT_LISTING: handleEditListing,
  TRACK_RENTAL: handleTrackRental,
  CHECK_DEPOSIT: handleCheckDeposit,
  CHECK_DELIVERY: handleCheckDelivery,
  CHECK_PICKUP: handleCheckPickup,
  GENERAL_HELP: handleGeneralHelp,
  UNKNOWN: handleUnknown,
};

// Intents that map to a simple page navigation (no data fetch needed)
const NAVIGATION_ONLY_INTENTS = new Set([
  'VIEW_WISHLIST',
  'VIEW_MESSAGES',
  'VIEW_PROFILE',
  'VIEW_WALLET',
  'VIEW_REVIEWS',
  'VIEW_OWNER_DASHBOARD',
  'VIEW_ADMIN_DASHBOARD',
  'VIEW_HELP',
  'CANCEL_ACTION',
]);

/**
 * Execute a validated intent using only the allowlisted tools.
 * Returns a safe ToolResult. Never throws for user-facing errors.
 */
export async function executeIntent(intent: AIAssistantIntent, ctx: ToolContext): Promise<ToolResult> {
  try {
    if (NAVIGATION_ONLY_INTENTS.has(intent.intent)) {
      return navigateToPage(intent, ctx);
    }
    const handler = TOOL_DISPATCH[intent.intent];
    if (!handler) {
      return { success: false, message: 'I\'m not sure how to handle that request yet.', navigation: { type: 'NONE' } };
    }
    return await handler(intent, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return { success: false, message: `I ran into an issue: ${message}`, navigation: { type: 'NONE' } };
  }
}