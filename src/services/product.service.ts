import ApiError from '../utils/ApiError';
import slugify from '../utils/slugify';
import ProductRepository from '../repositories/ProductRepository';
import CategoryRepository from '../repositories/CategoryRepository';
import ProductAvailabilityRepository from '../repositories/ProductAvailabilityRepository';
import ProductImageRepository from '../repositories/ProductImageRepository';
import { CreateProductInput, UpdateProductInput } from '../validators/product';
import { Types } from 'mongoose';

/**
 * Internal test/smoke products that must never appear in the public demo
 * marketplace. This is defense-in-depth on top of the seed cleanup so that
 * re-running smoke tests later cannot pollute the public listings again.
 */
const TEST_PRODUCT_PATTERN = /smoke test|test camera|^test product$/i;
const TEST_SLUG_PATTERN = /test-product|test-camera|smoke-test/i;

/** Escape regex special characters in a user/AI-provided string. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ProductService {
  async createProduct(ownerId: string, input: CreateProductInput, imageUrls: string[] = []) {
    const category = await CategoryRepository.findById(input.category);
    if (!category) throw new ApiError(404, 'Category not found');

    const baseSlug = slugify(input.title);
    let slug = baseSlug;
    let count = 1;
    while (await ProductRepository.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const product = await ProductRepository.create({
      title: input.title,
      description: input.description,
      category: input.category as any,
      owner: ownerId as any,
      images: imageUrls,
      condition: input.condition,
      location: (input.location || {
        address: '',
        city: '',
        state: '',
        zip: '',
        coordinates: { lat: 0, lng: 0 },
      }) as any,
      pickupLocation: (input.pickupLocation || {}) as any,
      rentalPrice: input.rentalPrice,
      priceUnit: input.priceUnit,
      securityDeposit: input.securityDeposit,
      features: input.features || [],
      tags: input.tags || [],
      deliveryOptions: input.deliveryOptions || [],
      cancellationPolicy: input.cancellationPolicy || 'flexible',
      slug,
      moderationStatus: 'pending',
      listingStatus: 'active',
      saleEnabled: input.saleEnabled ?? false,
      salePrice: input.salePrice ?? null,
      purchaseCondition: input.purchaseCondition ?? null,
      productStatus: 'available',
    });

    // Save individual image records
    for (let i = 0; i < imageUrls.length; i++) {
      await ProductImageRepository.create({
        product: product._id as any,
        url: imageUrls[i],
        isPrimary: i === 0,
        sortOrder: i,
      });
    }

    return ProductRepository.findByIdPopulated(product.id);
  }

  async updateProduct(id: string, ownerId: string, input: UpdateProductInput) {
    const product = await ProductRepository.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.owner.toString() !== ownerId) {
      throw new ApiError(403, 'You can only update your own products');
    }

    const updateData: Record<string, unknown> = { ...input };
    if (input.title) updateData.slug = slugify(input.title);

    const updated = await ProductRepository.updateById(id, updateData);
    return ProductRepository.findByIdPopulated(id);
  }

  async deleteProduct(id: string, ownerId?: string) {
    const product = await ProductRepository.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    if (ownerId && product.owner.toString() !== ownerId) {
      throw new ApiError(403, 'You can only delete your own products');
    }
    await ProductImageRepository.deleteForProduct(id);
    await ProductRepository.deleteById(id);
  }

  async listProducts(filters: any) {
    const filter: Record<string, unknown> = { listingStatus: 'active', moderationStatus: 'approved' };

    // Never surface internal test/smoke products in the public marketplace.
    filter.$and = [
      { title: { $not: TEST_PRODUCT_PATTERN } },
      { slug: { $not: TEST_SLUG_PATTERN } },
    ];

    if (filters.category) {
      // The frontend sends category slugs (e.g. "laptops", "gaming").
      // Resolve to the category ObjectId if it is not already one.
      const categoryValue = String(filters.category);
      if (/^[0-9a-fA-F]{24}$/.test(categoryValue)) {
        filter.category = categoryValue;
      } else {
        let category = await CategoryRepository.findBySlug(categoryValue);
        if (!category) {
          // Fallback: try a case-insensitive name match (e.g. "Camera" -> "Cameras").
          // This handles AI-generated singular category names like "camera", "laptop",
          // "projector" that don't match the plural slug ("cameras", "laptops", "projectors").
          // Use a prefix match so "camera" matches "Cameras" and "laptop" matches "Laptops".
          category = await CategoryRepository.findByName(new RegExp(`^${escapeRegExp(categoryValue)}`, 'i'));
        }
        if (category) {
          filter.category = category._id;
        } else {
          // No matching category -> return an empty result.
          filter.category = new Types.ObjectId('000000000000000000000000');
        }
      }
    }
    if (filters.owner) filter.owner = filters.owner;

    // Normalize display conditions ("Like New") to the stored snake_case
    // enum values ("like_new").
    if (filters.condition) {
      const conditionValue = String(filters.condition).toLowerCase().replace(/[^a-z]+/g, '_');
      const normalMap: Record<string, string> = {
        'new': 'new',
        'like_new': 'like_new',
        'good': 'good',
        'fair': 'fair',
        'used': 'used',
      };
      if (normalMap[conditionValue]) {
        filter.condition = normalMap[conditionValue];
      }
    }

    if (filters.minPrice || filters.maxPrice) {
      const priceRange: Record<string, number> = {};
      if (filters.minPrice) priceRange.$gte = Number(filters.minPrice);
      if (filters.maxPrice) priceRange.$lte = Number(filters.maxPrice);
      filter.rentalPrice = priceRange;
    }
    if (filters.minRating) filter.rating = { $gte: Number(filters.minRating) };

    // Location: match against city or state (case-insensitive substring).
    if (filters.location) {
      const locationValue = String(filters.location).trim();
      if (locationValue) {
        filter.$and = [
          ...(Array.isArray(filter.$and) ? filter.$and : []),
          {
            $or: [
              { 'location.city': { $regex: locationValue, $options: 'i' } },
              { 'location.state': { $regex: locationValue, $options: 'i' } },
              { 'location.address': { $regex: locationValue, $options: 'i' } },
              { 'location.zip': { $regex: locationValue, $options: 'i' } },
            ],
          },
        ];
      }
    }

    // Availability: 'available' => not sold (rentable), 'rented' => currently rented.
    // The Product schema has no embedded availability object; the authoritative
    // field is productStatus ('available' | 'rented' | 'sold').
    // Fulfillment method: 'delivery' or 'pickup' filters by deliveryOptions.
    if (filters.delivery) {
      const deliveryValue = String(filters.delivery).toLowerCase();
      if (deliveryValue === 'delivery') {
        filter.deliveryOptions = { $in: ['delivery', 'both'] };
      } else if (deliveryValue === 'pickup') {
        filter.deliveryOptions = { $in: ['pickup', 'both'] };
      }
    }

    if (filters.availability && filters.availability !== 'all') {
      const availabilityValue = String(filters.availability).toLowerCase();
      if (availabilityValue === 'available') {
        filter.productStatus = 'available';
      } else if (availabilityValue === 'rented') {
        filter.productStatus = 'rented';
      }
    }

    const result = await ProductRepository.listProducts(filter, {
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
      search: filters.search,
    });

    return result;
  }

  async getBySlug(slug: string) {
    const product = await ProductRepository.findBySlug(slug);
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
  }

  async getById(id: string) {
    const product = await ProductRepository.findByIdPopulated(id);
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
  }

  async getOwnerProducts(ownerId: string) {
    return ProductRepository.find(
      { owner: ownerId as any },
      { sort: { createdAt: -1 as 1 | -1 } }
    );
  }

  async blockDates(productId: string, ownerId: string, input: { reason: string; startDate: Date; endDate: Date; note?: string }) {
    const product = await ProductRepository.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.owner.toString() !== ownerId) {
      throw new ApiError(403, 'You can only manage your own products');
    }

    const conflicts = await ProductAvailabilityRepository.findConflicts(productId, input.startDate, input.endDate);
    if (conflicts.length) throw new ApiError(409, 'Dates already blocked for this product');

    return ProductAvailabilityRepository.create({
      product: productId as any,
      reason: input.reason as any,
      startDate: input.startDate,
      endDate: input.endDate,
      note: input.note || '',
      createdBy: ownerId as any,
    });
  }

  async getAvailability(productId: string) {
    const product = await ProductRepository.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');
    return ProductAvailabilityRepository.findByProduct(productId);
  }

  async removeBlock(blockId: string, ownerId: string): Promise<void> {
    const block = await ProductAvailabilityRepository.findById(blockId);
    if (!block) throw new ApiError(404, 'Blocked date not found');
    if (block.createdBy.toString() !== ownerId) {
      throw new ApiError(403, 'You can only remove your own blocks');
    }
    await ProductAvailabilityRepository.deleteById(blockId);
  }
}

export default new ProductService();