import ApiError from '../utils/ApiError';
import PurchaseRequestRepository from '../repositories/PurchaseRequestRepository';
import PurchaseRepository from '../repositories/PurchaseRepository';
import ProductRepository from '../repositories/ProductRepository';
import BookingRepository from '../repositories/BookingRepository';
import { CreatePurchaseRequestInput, CreatePurchaseInput } from '../validators/purchase';
import {
  notifyPurchaseRequestCreated,
  notifyPurchaseRequestUpdated,
  notifyPurchaseCompleted,
} from './notification.service';

const PLATFORM_FEE_PERCENT = 0;

export class PurchaseService {
  // ============================================================
  // Purchase Requests (Renter -> Owner)
  // ============================================================

  async createPurchaseRequest(renterId: string, input: CreatePurchaseRequestInput) {
    const product = await ProductRepository.findById(input.productId);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.productStatus === 'sold') throw new ApiError(400, 'This product has already been sold');
    if (!product.saleEnabled) throw new ApiError(400, 'This product is not available for purchase');
    if (product.owner.toString() === renterId) {
      throw new ApiError(400, 'You cannot request to purchase your own product');
    }

    // If a rentalId is provided, verify it belongs to the renter and is for this product
    if (input.rentalId) {
      const booking = await BookingRepository.findById(input.rentalId);
      if (!booking) throw new ApiError(404, 'Rental booking not found');
      if (booking.renter.toString() !== renterId) {
        throw new ApiError(403, 'You can only request to buy an item you are renting');
      }
      if (booking.product.toString() !== input.productId) {
        throw new ApiError(400, 'Rental booking does not match the product');
      }
    }

    // Prevent duplicate active requests
    const existing = await PurchaseRequestRepository.findActivePendingProductRequest(input.productId, renterId);
    if (existing) {
      throw new ApiError(409, 'You already have a pending purchase request for this product');
    }

    const request = await PurchaseRequestRepository.create({
      product: input.productId as any,
      renter: renterId as any,
      owner: product.owner,
      rentalId: input.rentalId ? (input.rentalId as any) : null,
      offeredPrice: product.salePrice ?? 0,
      status: 'pending',
      message: input.message || '',
    });

    // Notify the owner
    void notifyPurchaseRequestCreated({
      userId: product.owner.toString(),
      title: 'New purchase request',
      message: `New purchase request for ${product.title}.`,
      link: '/owner/purchase-requests',
    });

    return PurchaseRequestRepository.findByIdPopulated(request.id);
  }

  async listMyPurchaseRequests(renterId: string, options: any) {
    return PurchaseRequestRepository.listForRenter(renterId, options);
  }

  async listOwnerPurchaseRequests(ownerId: string, options: any) {
    return PurchaseRequestRepository.listForOwner(ownerId, options);
  }

  async getPurchaseRequest(id: string, userId?: string) {
    const request = await PurchaseRequestRepository.findByIdPopulated(id);
    if (!request) throw new ApiError(404, 'Purchase request not found');

    if (userId) {
      const isOwner = request.owner._id.toString() === userId;
      const isRenter = request.renter._id.toString() === userId;
      if (!isOwner && !isRenter) throw new ApiError(403, 'You do not have access to this purchase request');
    }
    return request;
  }

  async acceptPurchaseRequest(id: string, ownerId: string) {
    const request = await PurchaseRequestRepository.findByIdPopulated(id);
    if (!request) throw new ApiError(404, 'Purchase request not found');
    if (request.owner._id.toString() !== ownerId) {
      throw new ApiError(403, 'Only the owner can accept this purchase request');
    }
    if (request.status !== 'pending') {
      throw new ApiError(400, `Cannot accept a purchase request with status "${request.status}"`);
    }

    const product = await ProductRepository.findById(request.product._id.toString());
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.productStatus === 'sold') throw new ApiError(400, 'This product has already been sold');

    const updated = await PurchaseRequestRepository.updateById(id, { status: 'accepted' });

    // Notify the renter
    void notifyPurchaseRequestUpdated({
      userId: request.renter._id.toString(),
      title: 'Purchase request approved',
      message: `Your purchase request for ${product.title} has been approved.`,
      link: '/dashboard/my-purchases',
    });

    return updated;
  }

  async rejectPurchaseRequest(id: string, ownerId: string, reason?: string) {
    const request = await PurchaseRequestRepository.findByIdPopulated(id);
    if (!request) throw new ApiError(404, 'Purchase request not found');
    if (request.owner._id.toString() !== ownerId) {
      throw new ApiError(403, 'Only the owner can reject this purchase request');
    }
    if (request.status !== 'pending') {
      throw new ApiError(400, `Cannot reject a purchase request with status "${request.status}"`);
    }

    const product = await ProductRepository.findById(request.product._id.toString());
    const updated = await PurchaseRequestRepository.updateById(id, {
      status: 'rejected',
      message: reason || request.message,
    });

    // Notify the renter. Rental remains active per original terms.
    void notifyPurchaseRequestUpdated({
      userId: request.renter._id.toString(),
      title: 'Purchase request declined',
      message: `Your purchase request for ${product?.title || 'the item'} was declined by the owner.`,
      link: '/dashboard/my-rentals',
    });

    return updated;
  }

  // ============================================================
  // Purchases
  // ============================================================

  async createPurchase(buyerId: string, input: CreatePurchaseInput) {
    const product = await ProductRepository.findById(input.productId);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.productStatus === 'sold') throw new ApiError(400, 'This product has already been sold');
    if (!product.saleEnabled || !product.salePrice) {
      throw new ApiError(400, 'This product is not available for purchase');
    }
    if (product.owner.toString() === buyerId) {
      throw new ApiError(400, 'You cannot purchase your own product');
    }

    // Validate the optional purchase request
    let purchaseRequestId: string | null = null;
    if (input.purchaseRequestId) {
      const request = await PurchaseRequestRepository.findById(input.purchaseRequestId);
      if (!request) throw new ApiError(404, 'Purchase request not found');
      if (request.product.toString() !== input.productId) {
        throw new ApiError(400, 'Purchase request does not match the product');
      }
      if (request.renter.toString() !== buyerId) {
        throw new ApiError(403, 'This purchase request was not created by you');
      }
      if (request.status !== 'accepted') {
        throw new ApiError(400, 'This purchase request has not been approved by the owner');
      }
      purchaseRequestId = request.id;
    }

    // Validate rentalId if provided
    let rentalId: string | null = null;
    if (input.rentalId) {
      const booking = await BookingRepository.findById(input.rentalId);
      if (!booking) throw new ApiError(404, 'Rental booking not found');
      if (booking.renter.toString() !== buyerId) {
        throw new ApiError(403, 'You can only purchase an item you are renting');
      }
      rentalId = booking.id;
    }

    // The authoritative price comes from the product record, never from the frontend.
    const price = product.salePrice;

    const purchase = await PurchaseRepository.create({
      product: input.productId as any,
      buyer: buyerId as any,
      owner: product.owner,
      rentalId: rentalId as any,
      purchaseRequestId: purchaseRequestId as any,
      price,
      status: 'pending',
      deliveryStatus: 'pending',
      deliveryOption: input.deliveryOption || 'pickup',
      deliveryAddress: input.deliveryAddress || '',
      deliveryFee: 0,
      platformFee: price * PLATFORM_FEE_PERCENT,
      paymentStatus: 'pending',
    });

    // Notify the owner
    void notifyPurchaseRequestCreated({
      userId: product.owner.toString(),
      title: 'New purchase',
      message: `A buyer wants to purchase ${product.title} for ${price}.`,
      link: '/owner/sales',
    });

    return PurchaseRepository.findByIdPopulated(purchase.id);
  }

  async confirmPurchase(id: string, buyerId: string) {
    const purchase = await PurchaseRepository.findByIdPopulated(id);
    if (!purchase) throw new ApiError(404, 'Purchase not found');
    if (purchase.buyer._id.toString() !== buyerId) {
      throw new ApiError(403, 'Only the buyer can confirm this purchase');
    }
    if (purchase.status !== 'pending') {
      throw new ApiError(400, `Cannot confirm a purchase with status "${purchase.status}"`);
    }

    const updated = await PurchaseRepository.updateById(id, {
      status: 'confirmed',
      paymentStatus: 'paid',
    });

    // Mark the product as SOLD
    const productId = purchase.product._id.toString();
    await ProductRepository.updateById(productId, { productStatus: 'sold', listingStatus: 'inactive' });

    // Mark linked purchase request as completed
    if (purchase.purchaseRequestId) {
      await PurchaseRequestRepository.updateById(purchase.purchaseRequestId.toString(), { status: 'completed' });
    }

    // If this purchase is tied to a rental, mark the rental as "Converted to Purchase"
    if (purchase.rentalId) {
      await BookingRepository.updateById(purchase.rentalId.toString(), {
        status: 'completed',
        notes: 'Converted to Purchase',
      });
    }

    const product = await ProductRepository.findById(productId);

    // Notifications
    void notifyPurchaseCompleted({
      userId: purchase.owner._id.toString(),
      title: 'Item sold',
      message: `${product?.title || 'Your item'} has been sold.`,
      link: '/owner/sales',
    });
    void notifyPurchaseCompleted({
      userId: buyerId,
      title: 'Purchase confirmed',
      message: `Your purchase of ${product?.title || 'the item'} is confirmed.`,
      link: '/dashboard/my-purchases',
    });

    return PurchaseRepository.findByIdPopulated(id);
  }

  async listMyPurchases(buyerId: string, options: any) {
    return PurchaseRepository.listForBuyer(buyerId, options);
  }

  async listOwnerSales(ownerId: string, options: any) {
    return PurchaseRepository.listForOwner(ownerId, options);
  }

  async getPurchase(id: string, userId?: string) {
    const purchase = await PurchaseRepository.findByIdPopulated(id);
    if (!purchase) throw new ApiError(404, 'Purchase not found');

    if (userId) {
      const isOwner = purchase.owner._id.toString() === userId;
      const isBuyer = purchase.buyer._id.toString() === userId;
      if (!isOwner && !isBuyer) throw new ApiError(403, 'You do not have access to this purchase');
    }
    return purchase;
  }
}

export default new PurchaseService();