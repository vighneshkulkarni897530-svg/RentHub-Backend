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
        const category = await CategoryRepository.findBySlug(categoryValue);
        if (category) {
          filter.category = category._id;
        } else {
          // No matching category -> return an empty result.
          filter.category = new Types.ObjectId('000000000000000000000000');
        }
      }
    }
    if (filters.owner) filter.owner = filters.owner;
    if (filters.condition) filter.condition = filters.condition;
    if (filters.minPrice || filters.maxPrice) {
      const priceRange: Record<string, number> = {};
      if (filters.minPrice) priceRange.$gte = Number(filters.minPrice);
      if (filters.maxPrice) priceRange.$lte = Number(filters.maxPrice);
      filter.rentalPrice = priceRange;
    }
    if (filters.minRating) filter.rating = { $gte: Number(filters.minRating) };

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

