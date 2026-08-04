import mongoose from 'mongoose';
import env from '../config/env';
import logger from '../config/logger';
import User from '../models/User';
import Category from '../models/Category';
import bcrypt from 'bcryptjs';

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', icon: 'Smartphone', description: 'Cameras, laptops, gaming consoles, and more', subcategories: ['Cameras', 'Computers', 'Audio', 'Gaming', 'Drones'] },
  { name: 'Tools & Equipment', slug: 'tools-equipment', icon: 'Wrench', description: 'Power tools, gardening equipment, and machinery', subcategories: ['Power Tools', 'Hand Tools', 'Gardening', 'Construction'] },
  { name: 'Vehicles', slug: 'vehicles', icon: 'Car', description: 'Cars, bikes, scooters, and boats', subcategories: ['Cars', 'Bikes', 'Scooters', 'Boats'] },
  { name: 'Furniture', slug: 'furniture', icon: 'Armchair', description: 'Sofas, tables, chairs, and home decor', subcategories: ['Sofas', 'Tables', 'Chairs', 'Beds', 'Decor'] },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: 'Bike', description: 'Camping gear, sports equipment, and outdoor gear', subcategories: ['Camping', 'Cycling', 'Water Sports', 'Fitness'] },
  { name: 'Party & Events', slug: 'party-events', icon: 'PartyPopper', description: 'Tents, tables, chairs, and party supplies', subcategories: ['Projectors', 'Party', 'Games', 'Music'] },
  { name: 'Cameras & Photography', slug: 'cameras-photography', icon: 'Camera', description: 'DSLRs, lenses, tripods, and lighting', subcategories: ['Cameras', 'Lenses', 'Lighting', 'Accessories'] },
  { name: 'Books & Media', slug: 'books-media', icon: 'BookOpen', description: 'Books, audiobooks, and educational material', subcategories: ['Books', 'Audiobooks', 'Educational'] },
  { name: 'Clothing & Accessories', slug: 'clothing-accessories', icon: 'Shirt', description: 'Designer wear, costumes, and luxury accessories', subcategories: ['Formal', 'Casual', 'Traditional', 'Costumes'] },
  { name: 'Musical Instruments', slug: 'musical-instruments', icon: 'Music', description: 'Guitars, pianos, drums, and audio equipment', subcategories: ['Guitars', 'Keyboards', 'Drums', 'Audio'] },
];

const ADMIN_USER = {
  name: 'Admin User',
  email: 'admin@renthub.com',
  password: 'AdminPass123',
  role: 'admin',
  phone: '+1 (555) 678-9012',
  verified: true,
  isEmailVerified: true,
};

const OWNER_USER = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  password: 'OwnerPass123',
  role: 'owner',
  phone: '+1 (555) 123-4567',
  verified: true,
  isEmailVerified: true,
};

const CUSTOMER_USER = {
  name: 'Sarah Chen',
  email: 'sarah@example.com',
  password: 'Password123',
  role: 'customer',
  phone: '+1 (555) 234-5678',
  verified: true,
  isEmailVerified: true,
};

async function seed() {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
    ]);

    // Seed categories
    await Category.insertMany(CATEGORIES);
    logger.info(`Seeded ${CATEGORIES.length} categories`);

    // Seed users
    const salt = await bcrypt.genSalt(10);
    const users = [ADMIN_USER, OWNER_USER, CUSTOMER_USER].map((u) => ({
      ...u,
      password: bcrypt.hashSync(u.password, salt),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
      location: { address: '', city: '', state: '', zip: '', coordinates: { lat: 0, lng: 0 } },
    }));
    await User.insertMany(users);
    logger.info(`Seeded ${users.length} users`);

    logger.info('✅ Seed completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${(error as Error).message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
}

void seed();

