// Validates the RentHub demo product data
const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB = 'renthub';

async function main() {
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const db = client.db(DB);
  const products = db.collection('products');

  console.log('=== TEST PRODUCTS (should be 0) ===');
  const smoke = await products.countDocuments({ title: /smoke test|test camera|test product/i });
  console.log('smoke/test title count:', smoke);

  const smokeSlugs = await products.countDocuments({ slug: /test-product|test-camera|smoke-test/i });
  console.log('test slug count:', smokeSlugs);

  console.log('\n=== UNIQUE CHECK ===');
  const all = await products.find({}).toArray();
  const dupIds = all.filter((p, i) => all.findIndex((x) => String(x._id) === String(p._id)) !== i);
  const dupTitles = all.filter((p, i) => all.findIndex((x) => x.title === p.title) !== i);
  console.log('Duplicate _id:', dupIds.length);
  console.log('Duplicate titles:', dupTitles.length);
  console.log('Total products:', all.length);

  const demoImg = all.filter((p) => Array.isArray(p.images) && p.images.length && p.images[0].startsWith('/images/demo/'));
  console.log('Products with local demo image:', demoImg.length);

  const extImg = all.filter((p) => Array.isArray(p.images) && p.images.some((i) => /^https?:\/\//.test(i)));
  console.log('Products with external http image URL:', extImg.length);

  const noImg = all.filter((p) => !Array.isArray(p.images) || p.images.length === 0);
  console.log('Products with no image:', noImg.length);

  console.log('\n=== PRODUCT LIST ===');
  all.sort((a, b) => a.title.localeCompare(b.title));
  for (const p of all) {
    console.log(`${p.title} | ${p.slug} | ${(p.images || [])[0] || 'NO IMAGE'} | feat:${p.isFeatured ? 'Y' : 'N'} trend:${p.isTrending ? 'Y' : 'N'}`);
  }

  await client.close();
}

main().catch((e) => {
  console.error('Validation failed:', e.message);
  process.exit(1);
});