import ProductRepository from '../../repositories/ProductRepository';
import CategoryRepository from '../../repositories/CategoryRepository';
import {
  analyze,
  termFrequency,
  cosineSimilarity,
  extractPriceRange,
  detectCategory,
  normalize,
} from '../../utils/ai/text';

/**
 * Semantic search service: converts a natural-language query into an
 * enriched product search using tokenization, stemmed cosine similarity,
 * category detection, and price-range extraction. Works standalone with
 * no external ML dependency.
 */
export class SemanticSearchService {
  /**
   * Build a semantic search query for the product repository.
   * Returns enriched filters plus a relevance score map.
   */
  async semanticSearch(query: string, options: { limit?: number; sort?: string } = {}) {
    const normalized = normalize(query);
    const queryTokens = analyze(normalized);
    const priceRange = extractPriceRange(normalized);
    const detectedCategory = detectCategory(normalized);

    const filters: Record<string, unknown> = {
      listingStatus: 'active',
      moderationStatus: 'approved',
    };

    if (priceRange) {
      if (priceRange.min !== undefined) filters['rentalPrice.$gte'] = priceRange.min;
      if (priceRange.max !== undefined) filters['rentalPrice.$lte'] = priceRange.max;
    }

    // Resolve detected category slug to an ObjectId.
    let categoryId: string | null = null;
    if (detectedCategory) {
      const category = await CategoryRepository.findOne({ slug: detectedCategory });
      if (category) {
        categoryId = String(category._id);
        filters.category = category._id;
      }
    }

    // Fetch candidate products (all matching price/category filters).
    const result = await ProductRepository.listProducts(filters, {
      page: 1,
      limit: Math.min(options.limit || 50, 200),
      sort: options.sort,
    });

    const queryTf = termFrequency(queryTokens);
    const scored = (result.data as any[]).map((product) => {
      const productText = `${product.title} ${product.description} ${(product.tags || []).join(' ')} ${product.features || ''}`;
      const productTf = termFrequency(analyze(productText));
      const similarity = cosineSimilarity(queryTf, productTf);
      return {
        product,
        relevance: similarity,
      };
    });

    // Sort by relevance descending, keep above threshold.
    scored.sort((a, b) => b.relevance - a.relevance);
    const threshold = queryTokens.length > 0 ? 0.05 : 0;
    const relevant = scored.filter((s) => s.relevance >= threshold);

    const data = relevant.map((s) => s.product);
    const total = relevant.length;

    return {
      data,
      total,
      page: 1,
      limit: options.limit || 20,
      totalPages: Math.ceil(total / (options.limit || 20)),
      hasNext: false,
      hasPrev: false,
      semantic: {
        query: normalized,
        tokens: queryTokens,
        priceRange,
        detectedCategory: categoryId ? { slug: detectedCategory, id: categoryId } : null,
        recommendedSort: options.sort || 'relevance',
      },
    };
  }
}

export default new SemanticSearchService();
