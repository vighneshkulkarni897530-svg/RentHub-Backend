import { normalize } from '../../utils/ai/text';

/**
 * AI Description Generator.
 * Generates professional titles, descriptions, features, specifications,
 * SEO keywords, and meta descriptions from basic product inputs.
 */
export class DescriptionService {
  generate(input: {
    title?: string;
    category?: string;
    brand?: string;
    condition?: string;
    priceUnit?: string;
    features?: string[];
    tags?: string[];
    location?: string;
  }) {
    const category = input.category || 'item';
    const brand = input.brand || '';
    const condition = this.conditionLabel(input.condition || 'good');
    const features = input.features || [];
    const tags = input.tags || [];

    // 1. Title generation.
    const title = this.generateTitle(input);

    // 2. Description generation.
    const description = this.generateDescription(input, category, brand, condition, features);

    // 3. Features (if empty, derive from category).
    const generatedFeatures = features.length
      ? features
      : this.defaultFeatures(category, brand);

    // 4. Specifications (derived from features + defaults).
    const specifications = this.generateSpecifications(category, brand, condition, features);

    // 5. SEO keywords.
    const seoKeywords = this.generateSeoKeywords(title, category, brand, tags);

    // 6. Meta description.
    const metaDescription = this.generateMetaDescription(description, brand, category);

    return {
      title,
      description,
      features: generatedFeatures,
      specifications,
      seoKeywords,
      metaDescription,
      confidence: 0.85,
    };
  }

  private generateTitle(input: { title?: string; category?: string; brand?: string; condition?: string }): string {
    if (input.title && input.title.trim().length > 3) return input.title.trim();
    const brand = input.brand ? `${input.brand} ` : '';
    const category = input.category || 'item';
    const condition = input.condition && input.condition !== 'good' ? ` (${this.conditionLabel(input.condition)})` : '';
    return `${brand}${this.capitalize(category)} for rent${condition}`;
  }

  private generateDescription(
    input: { features?: string[]; tags?: string[] },
    category: string,
    brand: string,
    condition: string,
    features: string[]
  ): string {
    const brandPart = brand ? ` from ${brand}` : '';
    const featureList = features.length
      ? features.map((f) => `- ${f}`).join('\n')
      : this.defaultFeatures(category, brand).map((f) => `- ${f}`).join('\n');
    const tagLine = (input.tags || []).length ? `Ideal for: ${(input.tags || []).slice(0, 5).join(', ')}.` : '';
    return [
      `Rent this ${condition} ${category}${brandPart} for your next project or event.`,
      ``,
      `Key features:`,
      featureList,
      ``,
      `Whether you need it for a day, a week, or a month, this ${category} is well-maintained and ready to use.`,
      `${tagLine}`,
      `Rent affordably and avoid the cost of buying. Please review the listing details and delivery/pickup options before booking.`,
    ].join('\n');
  }

  private defaultFeatures(category: string, brand: string): string[] {
    const brandLabel = brand ? `${brand} ` : '';
    const map: Record<string, string[]> = {
      'cameras': ['High-resolution image sensor', 'Interchangeable lens compatibility', '4K video recording', 'Built-in stabilisation'],
      'electronics': ['Premium build quality', 'Latest firmware', 'Includes accessories', 'Energy efficient'],
      'vehicles': ['Fuel efficient', 'Recently serviced', 'Full insurance', 'Comfortable seating'],
      'tools-equipment': ['Heavy-duty construction', 'Safety certified', 'Includes carrying case', 'Ergonomic design'],
      'sports-outdoors': ['Lightweight design', 'Durable materials', 'Easy to transport', 'Weather resistant'],
      'furniture': ['Sturdy construction', 'Comfortable', 'Easy to assemble', 'Stylish design'],
      'appliances': ['Energy efficient', 'Quick setup', 'Easy to clean', 'Reliable performance'],
    };
    const base = map[category.toLowerCase()] || [
      'Well-maintained condition',
      'Clean and ready to use',
      'Includes all accessories',
      'Works reliably',
    ];
    return base.map((f) => `${brandLabel}${f}`);
  }

  private generateSpecifications(category: string, brand: string, condition: string, features: string[]): string[] {
    const specs: string[] = [`Category: ${this.capitalize(category)}`, `Condition: ${this.conditionLabel(condition)}`];
    if (brand) specs.push(`Brand: ${brand}`);
    if (features.length) specs.push(`Includes: ${features.slice(0, 4).join(', ')}`);
    specs.push(`Rental unit: per day`);
    return specs;
  }

  private generateSeoKeywords(title: string, category: string, brand: string, tags: string[]): string[] {
    const keywords = new Set<string>();
    keywords.add(category.toLowerCase());
    if (brand) keywords.add(brand.toLowerCase());
    for (const w of title.toLowerCase().split(/\s+/)) {
      if (w.length > 2) keywords.add(w);
    }
    for (const t of tags) keywords.add(t.toLowerCase());
    keywords.add(`${category.toLowerCase()} for rent`);
    keywords.add(`rent ${category.toLowerCase()}`);
    if (brand) keywords.add(`${brand.toLowerCase()} ${category.toLowerCase()} rental`);
    return Array.from(keywords).slice(0, 15);
  }

  private generateMetaDescription(description: string, brand: string, category: string): string {
    const firstLine = description.split('\n')[0] || `Rent ${category} online.`;
    const suffix = brand ? ` by ${brand}` : '';
    return firstLine.slice(0, 150) + suffix;
  }

  private conditionLabel(condition: string): string {
    const map: Record<string, string> = {
      new: 'brand new',
      like_new: 'like-new',
      good: 'good',
      fair: 'fair',
      used: 'gently used',
    };
    return map[condition] || condition;
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

export default new DescriptionService();
