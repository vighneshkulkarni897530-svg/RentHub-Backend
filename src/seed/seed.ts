import mongoose from 'mongoose';
import env from '../config/env';
import logger from '../config/logger';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import ProductImage from '../models/ProductImage';
import bcrypt from 'bcryptjs';

// ============================================================
// RentHub Demo Seed
// ============================================================
// Creates 12 unique rental products with local demo images so the
// marketplace looks like a real production demo, and removes
// internal test/smoke products ("Smoke Test Camera", "Test Camera
// for Rent", "test-product") from the demo database.
//
// Real user-created products (titles that do not match the test
// patterns) are preserved. Existing users & categories are upserted
// so nothing else is destroyed.
// ============================================================

const CATEGORIES: Array<{
  name: string;
  slug: string;
  icon: string;
  image: string;
  description: string;
  subcategories: string[];
}> = [
  { name: 'Laptops', slug: 'laptops', icon: 'Laptop', image: '/images/demo/laptop.svg', description: 'Premium laptops and notebooks for rent by the day', subcategories: ['MacBooks', 'Windows Ultrabooks', 'Business Laptops'] },
  { name: 'Cameras', slug: 'cameras', icon: 'Camera', image: '/images/demo/camera.svg', description: 'DSLRs, mirrorless cameras and photography gear', subcategories: ['DSLR', 'Mirrorless', 'Action Cameras'] },
  { name: 'Speakers', slug: 'speakers', icon: 'Speaker', image: '/images/demo/speaker.svg', description: 'Party speakers and portable Bluetooth audio', subcategories: ['Party Speakers', 'Portable Speakers'] },
  { name: 'Drones', slug: 'drones', icon: 'Plane', image: '/images/demo/drone.svg', description: 'Camera drones for aerial photography and videography', subcategories: ['Camera Drones', 'Mini Drones', 'FPV'] },
  { name: 'Projectors', slug: 'projectors', icon: 'MonitorPlay', image: '/images/demo/projector.svg', description: 'Home theatre and business projectors for rent', subcategories: ['Home Theatre', 'Business', 'Mini Projectors'] },
  { name: 'Gaming', slug: 'gaming', icon: 'Gamepad2', image: '/images/demo/gaming-console.svg', description: 'Gaming consoles, controllers and accessories', subcategories: ['Consoles', 'Controllers', 'VR'] },
  { name: 'Sports', slug: 'sports', icon: 'Bike', image: '/images/demo/bicycle.svg', description: 'Cycles, fitness and outdoor sports equipment', subcategories: ['Cycling', 'Fitness', 'Outdoor Sports'] },
  { name: 'Camping', slug: 'camping', icon: 'Tent', image: '/images/demo/camping.svg', description: 'Tents and camping gear for your next adventure', subcategories: ['Tents', 'Camping Gear', 'Hiking'] },
  { name: 'Smartphones', slug: 'smartphones', icon: 'Smartphone', image: '/images/demo/smartphone.svg', description: 'Latest smartphones available for short-term rental', subcategories: ['Flagships', 'Android', 'iPhone'] },
  { name: 'Tablets', slug: 'tablets', icon: 'Tablet', image: '/images/demo/tablet.svg', description: 'iPads and Android tablets for work and play', subcategories: ['iPad', 'Android Tablets'] },
  { name: 'Audio', slug: 'audio', icon: 'Headphones', image: '/images/demo/headphones.svg', description: 'Headphones, earbuds and personal audio devices', subcategories: ['Headphones', 'Earbuds', 'Noise Cancelling'] },
  { name: 'Wearables', slug: 'wearables', icon: 'Watch', image: '/images/demo/watch.svg', description: 'Smart watches and wearable tech for rent', subcategories: ['Smart Watches', 'Fitness Bands'] },
];

// Demo owners (upserted by email — existing users keep their ids).
const OWNERS = [
  {
    seedName: 'alex-owner',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    password: 'OwnerPass123',
    role: 'owner',
    phone: '+91 98765 43210',
    city: 'Pune',
    state: 'Maharashtra',
    verified: true,
  },
  {
    seedName: 'priya-owner',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'OwnerPass123',
    role: 'owner',
    phone: '+91 91234 56780',
    city: 'Mumbai',
    state: 'Maharashtra',
    verified: true,
  },
  {
    seedName: 'rahul-owner',
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    password: 'OwnerPass123',
    role: 'owner',
    phone: '+91 99887 76655',
    city: 'Bengaluru',
    state: 'Karnataka',
    verified: true,
  },
];

const PRODUCTS: Array<{
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  ownerEmail: string;
  image: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'used';
  city: string;
  state: string;
  rentalPrice: number;
  deposit: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  features: string[];
  tags: string[];
  saleEnabled?: boolean;
  salePrice?: number;
  purchaseCondition?: string;
}> = [
  {
    slug: 'macbook-air-m2',
    title: 'MacBook Air M2',
    description: 'Ultra-thin MacBook Air M2 with 8-core CPU, 8GB unified memory and 256GB SSD. Perfect for travel, presentations and coding. Comes with charger and padded sleeve.',
    categorySlug: 'laptops',
    ownerEmail: 'alex@example.com',
    image: '/images/products/macbook-air-m2.jpg',
    condition: 'like_new',
    city: 'Pune',
    state: 'Maharashtra',
    rentalPrice: 800,
    deposit: 5000,
    rating: 4.8,
    reviewCount: 24,
    isFeatured: true,
    isTrending: false,
    features: ['M2 8-core CPU', '8GB unified memory', '256GB SSD', 'Retina display', 'Charger included'],
    tags: ['macbook', 'laptop', 'apple', 'ultrabook', 'work'],
    saleEnabled: true,
    salePrice: 75000,
    purchaseCondition: 'Like New — includes original box, charger and padded sleeve',
  },
  {
    slug: 'canon-eos-1500d-camera',
    title: 'Canon EOS 1500D Camera',
    description: 'Canon EOS 1500D DSLR with 18-55mm kit lens, EF-S 24.1 megapixel sensor and full HD video. Ideal for product shoots, events and travel photography.',
    categorySlug: 'cameras',
    ownerEmail: 'priya@example.com',
    image: '/images/products/canon-eos-1500d.jpg',
    condition: 'good',
    city: 'Mumbai',
    state: 'Maharashtra',
    rentalPrice: 700,
    deposit: 4000,
    rating: 4.7,
    reviewCount: 32,
    isFeatured: true,
    isTrending: false,
    features: ['24.1MP APS-C sensor', '18-55mm kit lens', 'Full HD video', 'SD card included', 'Camera bag'],
    tags: ['canon', 'dslr', 'camera', 'photography', 'lens'],
    saleEnabled: true,
    salePrice: 32000,
    purchaseCondition: 'Good — includes 18-55mm kit lens, SD card and camera bag',
  },
  {
    slug: 'jbl-partybox-speaker',
    title: 'JBL PartyBox Speaker',
    description: 'JBL PartyBox 310 portable party speaker with 240W output, deep bass, light show and up to 18 hours of playtime. Perfect for parties, events and gatherings.',
    categorySlug: 'speakers',
    ownerEmail: 'rahul@example.com',
    image: '/images/products/jbl-partybox.jpg',
    condition: 'good',
    city: 'Bengaluru',
    state: 'Karnataka',
    rentalPrice: 500,
    deposit: 3000,
    rating: 4.6,
    reviewCount: 41,
    isFeatured: false,
    isTrending: true,
    features: ['240W output', 'Built-in light show', '18-hour battery', 'Bluetooth/AUX', 'Wheels & handle'],
    tags: ['jbl', 'speaker', 'party', 'bluetooth', 'audio'],
  },
  {
    slug: 'dji-mini-drone',
    title: 'DJI Mini Drone',
    description: 'DJI Mini 3 Pro drone with 4K HDR video, 48MP photos, 3-axis gimbal and 34-minute flight time. Includes 2 batteries, remote controller and carrying case.',
    categorySlug: 'drones',
    ownerEmail: 'alex@example.com',
    image: '/images/products/dji-mini-drone.jpg',
    condition: 'like_new',
    city: 'Delhi',
    state: 'Delhi',
    rentalPrice: 1200,
    deposit: 8000,
    rating: 4.9,
    reviewCount: 18,
    isFeatured: true,
    isTrending: false,
    features: ['4K HDR video', '48MP photos', '3-axis gimbal', '34-min flight', '2 batteries'],
    tags: ['dji', 'drone', 'aerial', '4k', 'photography'],
    saleEnabled: true,
    salePrice: 45000,
    purchaseCondition: 'Like New — includes 2 batteries, remote controller and carrying case',
  },
  {
    slug: 'epson-projector',
    title: 'Epson Projector',
    description: 'Epson Full HD projector with 3000 lumens, HDMI/DVI connectivity and 120-inch projection. Great for movie nights, office presentations and events.',
    categorySlug: 'projectors',
    ownerEmail: 'priya@example.com',
    image: '/images/products/epson-projector.jpg',
    condition: 'good',
    city: 'Hyderabad',
    state: 'Telangana',
    rentalPrice: 600,
    deposit: 5000,
    rating: 4.5,
    reviewCount: 27,
    isFeatured: true,
    isTrending: false,
    features: ['Full HD 1080p', '3000 lumens', 'HDMI & VGA', '120" projection', 'Remote included'],
    tags: ['epson', 'projector', 'home theatre', 'presentation'],
    saleEnabled: true,
    salePrice: 38000,
    purchaseCondition: 'Good — includes remote, HDMI cable and carry case',
  },
  {
    slug: 'playstation-5',
    title: 'PlayStation 5',
    description: 'Sony PlayStation 5 with DualSense controller, 1TB SSD and 2 games included. Lightning-fast loading with ray tracing for an immersive gaming experience.',
    categorySlug: 'gaming',
    ownerEmail: 'rahul@example.com',
    image: '/images/products/playstation-5.jpg',
    condition: 'like_new',
    city: 'Chennai',
    state: 'Tamil Nadu',
    rentalPrice: 900,
    deposit: 9000,
    rating: 4.9,
    reviewCount: 56,
    isFeatured: true,
    isTrending: false,
    features: ['1TB SSD', 'DualSense controller', '4K 120fps', '2 games included', 'HDMI cable'],
    tags: ['playstation', 'ps5', 'gaming', 'console', 'sony'],
    saleEnabled: true,
    salePrice: 45000,
    purchaseCondition: 'Like New — includes DualSense controller, 2 games and HDMI cable',
  },
  {
    slug: 'mountain-bicycle',
    title: 'Mountain Bicycle',
    description: '21-speed mountain bicycle with dual disc brakes, front suspension and 26-inch alloy wheels. Ideal for city rides, trails and weekend adventures.',
    categorySlug: 'sports',
    ownerEmail: 'alex@example.com',
    image: '/images/products/mountain-bicycle.jpg',
    condition: 'good',
    city: 'Pune',
    state: 'Maharashtra',
    rentalPrice: 400,
    deposit: 2500,
    rating: 4.4,
    reviewCount: 22,
    isFeatured: false,
    isTrending: true,
    features: ['21-speed gears', 'Dual disc brakes', 'Front suspension', '26" alloy wheels', 'Helmet included'],
    tags: ['bicycle', 'cycle', 'mountain', 'sports', 'fitness'],
  },
  {
    slug: 'camping-tent',
    title: 'Camping Tent',
    description: 'Spacious 4-person camping tent with waterproof rainfly, UV protection and easy 10-minute setup. Great for camping trips, treks and beach outings.',
    categorySlug: 'camping',
    ownerEmail: 'priya@example.com',
    image: '/images/products/camping-tent.jpg',
    condition: 'new',
    city: 'Goa',
    state: 'Goa',
    rentalPrice: 450,
    deposit: 3000,
    rating: 4.3,
    reviewCount: 15,
    isFeatured: false,
    isTrending: true,
    features: ['4-person capacity', 'Waterproof rainfly', 'UV protection', '10-min setup', 'Carry bag'],
    tags: ['tent', 'camping', 'outdoor', 'adventure'],
  },
  {
    slug: 'samsung-galaxy-s24',
    title: 'Samsung Galaxy S24',
    description: 'Samsung Galaxy S24 with 6.2-inch AMOLED display, 50MP triple camera and all-day battery. Unlocked with 128GB storage and fast charging.',
    categorySlug: 'smartphones',
    ownerEmail: 'rahul@example.com',
    image: '/images/products/samsung-galaxy-s24.jpg',
    condition: 'like_new',
    city: 'Bengaluru',
    state: 'Karnataka',
    rentalPrice: 600,
    deposit: 6500,
    rating: 4.7,
    reviewCount: 38,
    isFeatured: false,
    isTrending: true,
    features: ['6.2" AMOLED', '50MP triple camera', '128GB storage', 'All-day battery', 'Fast charging'],
    tags: ['samsung', 'galaxy', 'smartphone', 'android', 'phone'],
  },
  {
    slug: 'ipad-air',
    title: 'iPad Air',
    description: 'iPad Air 5th gen with 10.9-inch Liquid Retina display, M1 chip and Apple Pencil support. Perfect for design, notes, media and productivity on the go.',
    categorySlug: 'tablets',
    ownerEmail: 'alex@example.com',
    image: '/images/products/ipad-air.jpg',
    condition: 'like_new',
    city: 'Mumbai',
    state: 'Maharashtra',
    rentalPrice: 650,
    deposit: 6000,
    rating: 4.8,
    reviewCount: 29,
    isFeatured: true,
    isTrending: false,
    features: ['10.9" Liquid Retina', 'M1 chip', 'Apple Pencil support', '64GB storage', 'Wi-Fi + 5G'],
    tags: ['ipad', 'tablet', 'apple', 'creative', 'productivity'],
    saleEnabled: true,
    salePrice: 55000,
    purchaseCondition: 'Like New — includes original box, charger and Apple Pencil',
  },
  {
    slug: 'sony-wh-1000xm5-headphones',
    title: 'Sony WH-1000XM5 Headphones',
    description: 'Sony WH-1000XM5 wireless noise-cancelling headphones with 30-hour battery, multipoint connection and studio-quality sound. Perfect for travel and focus.',
    categorySlug: 'audio',
    ownerEmail: 'priya@example.com',
    image: '/images/products/sony-wh1000xm5.jpg',
    condition: 'like_new',
    city: 'Delhi',
    state: 'Delhi',
    rentalPrice: 350,
    deposit: 2000,
    rating: 4.8,
    reviewCount: 63,
    isFeatured: false,
    isTrending: true,
    features: ['Industry-leading ANC', '30-hour battery', 'Multipoint connection', 'Hi-Res audio', 'Travel case'],
    tags: ['sony', 'headphones', 'noise cancelling', 'audio', 'wireless'],
  },
  {
    slug: 'smart-watch',
    title: 'Smart Watch',
    description: 'Fitness smart watch with AMOLED display, heart-rate and SpO2 monitoring, GPS and 7-day battery life. Ideal for workouts, tracking and daily wear.',
    categorySlug: 'wearables',
    ownerEmail: 'rahul@example.com',
    image: '/images/products/smart-watch.jpg',
    condition: 'new',
    city: 'Jaipur',
    state: 'Rajasthan',
    rentalPrice: 250,
    deposit: 1500,
    rating: 4.2,
    reviewCount: 19,
    isFeatured: false,
    isTrending: true,
    features: ['AMOLED display', 'Heart-rate + SpO2', 'GPS tracking', '7-day battery', 'Water resistant'],
    tags: ['smartwatch', 'watch', 'fitness', 'wearable', 'health'],
  },
];

async function upsertUser(userData: (typeof OWNERS)[number]) {
  const salt = await bcrypt.genSalt(10);
  return User.findOneAndUpdate(
    { email: userData.email },
    {
      name: userData.name,
      email: userData.email,
      password: bcrypt.hashSync(userData.password, salt),
      role: userData.role,
      phone: userData.phone,
      avatar: '/images/demo/avatar.svg',
      verified: true,
      isEmailVerified: true,
      kycStatus: 'verified' as const,
      status: 'active' as const,
      rating: 4.9,
      location: {
        address: '',
        city: userData.city,
        state: userData.state,
        zip: '',
        coordinates: { lat: 0, lng: 0 },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();
}

async function seed() {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info('Connected to MongoDB for seeding');

    // ---- 1. Remove internal test/smoke products (keep real user products) ----
    const testPatternFilter = {
      $or: [
        { title: /smoke test/i },
        { title: /test camera/i },
        { title: /^test product$/i },
        { slug: /test-product/ },
      ],
    };
    const testProducts = await Product.find(testPatternFilter).select('_id').exec();
    if (testProducts.length) {
      const ids = testProducts.map((p) => p._id);
      await ProductImage.deleteMany({ product: { $in: ids } }).exec();
      const res = await Product.deleteMany({ _id: { $in: ids } }).exec();
      logger.info(`Removed ${res.deletedCount || testProducts.length} test/smoke product(s) from the demo database`);
    } else {
      logger.info('No test/smoke products found — nothing to clean');
    }

    // ---- 2. Upsert categories ----
    const categoryDocs = await Promise.all(
      CATEGORIES.map(async (cat) =>
        Category.findOneAndUpdate(
          { slug: cat.slug },
          { ...cat, status: 'active' },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).exec()
      )
    );
    logger.info(`Upserted ${categoryDocs.length} categories`);

    // Deactivate legacy empty categories (old seed groups like "Electronics")
    // so the demo marketplace only shows categories that actually have products.
    const demoSlugs = new Set(CATEGORIES.map((c) => c.slug));
    const allCategories = await Category.find({}).select('_id slug').exec();
    const activeProductCounts = await Product.aggregate([
      { $match: { listingStatus: 'active', moderationStatus: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]).exec();
    const countByCategory = new Map(activeProductCounts.map((c) => [String(c._id), c.count as number]));
    const staleCategoryIds = allCategories
      .filter((c) => !demoSlugs.has(c.slug) && !countByCategory.has(String(c._id)))
      .map((c) => c._id);
    if (staleCategoryIds.length) {
      await Category.updateMany({ _id: { $in: staleCategoryIds } }, { $set: { status: 'inactive' } }).exec();
      logger.info(`Deactivated ${staleCategoryIds.length} legacy empty categor${staleCategoryIds.length === 1 ? 'y' : 'ies'}`);
    }

    // ---- 3. Upsert demo owners ----
    const owners = await Promise.all(OWNERS.map(upsertUser));
    const ownerByEmail = new Map(owners.map((u) => [u.email, u._id]));
    logger.info(`Upserted ${owners.length} demo owners`);

    // ---- 4. Upsert 12 unique demo products ----
    let created = 0;
    let updated = 0;
    for (const demo of PRODUCTS) {
      const category = categoryDocs.find((c) => c.slug === demo.categorySlug);
      const ownerId = ownerByEmail.get(demo.ownerEmail);
      if (!category || !ownerId) {
        logger.warn(`Skipping ${demo.title}: missing category or owner`);
        continue;
      }

      const existing = await Product.findOne({ slug: demo.slug }).select('_id').exec();
      const product = await Product.findOneAndUpdate(
        { slug: demo.slug },
        {
          slug: demo.slug,
          title: demo.title,
          description: demo.description,
          category: category._id as any,
          owner: ownerId as any,
          images: [demo.image],
          condition: demo.condition,
          location: {
            address: '',
            city: demo.city,
            state: demo.state,
            zip: '',
            coordinates: { lat: 0, lng: 0 },
          },
          rentalPrice: demo.rentalPrice,
          priceUnit: 'day',
          securityDeposit: demo.deposit,
          features: demo.features,
          tags: demo.tags,
          moderationStatus: 'approved',
          listingStatus: 'active',
          isFeatured: demo.isFeatured,
          isTrending: demo.isTrending,
          rating: demo.rating,
          reviewCount: demo.reviewCount,
          bookingsCount: Math.round(demo.reviewCount * 1.7),
          totalRevenue: 0,
          deliveryOptions: ['pickup', 'delivery', 'both'],
          cancellationPolicy: 'flexible',
          saleEnabled: demo.saleEnabled ?? false,
          salePrice: demo.salePrice ?? null,
          purchaseCondition: demo.purchaseCondition ?? null,
          productStatus: 'available',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).exec();

      // Keep product image records in sync (defense-in-depth).
      await ProductImage.findOneAndUpdate(
        { product: product._id as any, url: demo.image },
        { product: product._id as any, url: demo.image, isPrimary: true, sortOrder: 0 },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).exec();

      if (existing) updated++;
      else created++;
    }
    logger.info(`Demo products ready: ${created} created, ${updated} updated`);

    const demoCount = await Product.countDocuments({ listingStatus: 'active', moderationStatus: 'approved' }).exec();
    logger.info(`✅ Seed completed successfully! ${demoCount} active approved product(s) visible`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${(error as Error).message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
}

void seed();