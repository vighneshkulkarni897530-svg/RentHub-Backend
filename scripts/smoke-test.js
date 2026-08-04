/* eslint-disable no-console */
/**
 * RentHub Backend - Smoke Test Script
 * Tests health, categories, auth (register/login), and protected routes.
 *
 * Usage: node scripts/smoke-test.js
 */
const BASE = 'http://localhost:5000/api/v1';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

function log(label, status, data) {
  const ok = status >= 200 && status < 300;
  console.log(`${ok ? '✅' : '❌'} ${label} [${status}]`);
  if (!ok) console.log('   ', JSON.stringify(data).slice(0, 300));
}

async function run() {
  // 1. Health
  const health = await request('GET', '/health');
  log('GET /health', health.status || 200, health);

  // 2. Categories (public)
  const cats = await request('GET', '/categories');
  log('GET /categories', cats.status || 200, cats);
  console.log('   categories count:', (cats.data || []).length);

  // 3. Register a new customer
  const email = `test_${Date.now()}@example.com`;
  const register = await request('POST', '/auth/register', {
    name: 'Test Customer',
    email,
    password: 'Password123',
    confirmPassword: 'Password123',
    role: 'customer',
  });
  log('POST /auth/register', register.status || 201, register);

  // 4. Login (existing seeded users)
  const adminLogin = await request('POST', '/auth/login', {
    email: 'admin@renthub.com',
    password: 'AdminPass123',
  });
  log('POST /auth/login (admin)', adminLogin.status || 200, adminLogin);
  const adminToken = adminLogin.data?.accessToken;

  const ownerLogin = await request('POST', '/auth/login', {
    email: 'alex@example.com',
    password: 'OwnerPass123',
  });
  log('POST /auth/login (owner)', ownerLogin.status || 200, ownerLogin);
  const ownerToken = ownerLogin.data?.accessToken;

  const customerLogin = await request('POST', '/auth/login', {
    email: 'sarah@example.com',
    password: 'Password123',
  });
  log('POST /auth/login (customer)', customerLogin.status || 200, customerLogin);
  const customerToken = customerLogin.data?.accessToken;

  // 5. Protected: profile
  if (customerToken) {
    const me = await request('GET', '/users/profile', undefined, customerToken);
    log('GET /users/profile', me.status || 200, me);
  }

  // 6. Admin: dashboard stats
  if (adminToken) {
    const stats = await request('GET', '/admin/dashboard', undefined, adminToken);
    log('GET /admin/dashboard', stats.status || 200, stats);
  }

  // 7. Owner: stats
  if (ownerToken) {
    const ownerStats = await request('GET', '/owner/stats', undefined, ownerToken);
    log('GET /owner/stats', ownerStats.status || 200, ownerStats);
  }

  // 8. Create a product as owner
  if (ownerToken) {
    const catsData = cats.data || [];
    const categoryId = catsData[0]?._id;
    if (categoryId) {
      const product = await request('POST', '/products', {
        title: 'Smoke Test Camera',
        description: 'A test camera product',
        category: categoryId,
        condition: 'new',
        location: { address: '123 Test', city: 'SF', state: 'CA', zip: '94105', coordinates: { lat: 37.7, lng: -122.4 } },
        rentalPrice: 25,
        priceUnit: 'day',
        securityDeposit: 200,
        features: ['Feature A'],
        tags: ['test'],
      }, ownerToken);
      log('POST /products', product.status || 201, product);
      const productId = product.data?._id || product.data?.id;
      let bookingId = null;
      console.log('   product id:', productId);

      // 9. List public products (should be 0 — pending moderation)
      const products = await request('GET', '/products');
      log('GET /products (pre-approval)', products.status || 200, products);
      console.log('   public products count:', (products.data?.data || products.data || []).length);

      // 10. Admin approves the product
      if (adminToken && productId) {
        const approve = await request('PUT', `/admin/products/${productId}/moderation`, { status: 'approved' }, adminToken);
        log('PUT /admin/products/:id/moderation', approve.status || 200, approve);

        // 11. Now public should see it
        const productsAfter = await request('GET', '/products');
        log('GET /products (post-approval)', productsAfter.status || 200, productsAfter);
        console.log('   public products count:', (productsAfter.data?.data || productsAfter.data || []).length);
      }

      // 12. Customer books the product
      if (customerToken && productId) {
        const booking = await request('POST', '/bookings', {
          product: productId,
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
          duration: 2,
          durationUnit: 'day',
          totalPrice: 50,
          securityDeposit: 200,
          notes: 'Smoke test booking',
        }, customerToken);
        log('POST /bookings', booking.status || 201, booking);
        bookingId = booking.data?._id || booking.data?.id;
        console.log('   booking id:', bookingId);

        // 13. Customer lists their bookings
        if (bookingId) {
          const myBookings = await request('GET', '/bookings', undefined, customerToken);
          log('GET /bookings (my bookings)', myBookings.status || 200, myBookings);
        }
      }

      // 14. Customer adds to wishlist
      if (customerToken && productId) {
        const wish = await request('POST', `/wishlist/${productId}`, {}, customerToken);
        log('POST /wishlist/:productId', wish.status || 200, wish);

        const wishCheck = await request('GET', `/wishlist/${productId}/check`, undefined, customerToken);
        log('GET /wishlist/:productId/check', wishCheck.status || 200, wishCheck);

        const wishlist = await request('GET', '/wishlist', undefined, customerToken);
        log('GET /wishlist', wishlist.status || 200, wishlist);
      }

      // 15. Customer reviews the product
      if (customerToken && productId) {
        const review = await request('POST', `/reviews/product/${productId}`, {
          rating: 5,
          comment: 'Great product, highly recommended!',
        }, customerToken);
        log('POST /reviews/product/:id', review.status || 201, review);

        const productReviews = await request('GET', `/reviews/product/${productId}`);
        log('GET /reviews/product/:id', productReviews.status || 200, productReviews);
      }

      // 16. Messages: customer sends owner a message
      if (customerToken && ownerToken && productId) {
        const msg = await request('POST', '/messages', {
          receiver: ownerLogin.data?.user?.id,
          content: 'Hi, is this available next week?',
          product: productId,
        }, customerToken);
        log('POST /messages', msg.status || 201, msg);

        const conversations = await request('GET', '/messages/conversations', undefined, customerToken);
        log('GET /messages/conversations', conversations.status || 200, conversations);
      }

      // 17. Notifications
      if (customerToken) {
        const notifs = await request('GET', '/notifications', undefined, customerToken);
        log('GET /notifications', notifs.status || 200, notifs);
        const unread = await request('GET', '/notifications/unread-count', undefined, customerToken);
        log('GET /notifications/unread-count', unread.status || 200, unread);
      }

      // 18. Report the product
      if (customerToken && productId) {
        const report = await request('POST', '/reports', {
          type: 'product',
          reportedItemId: productId,
          reason: 'Inaccurate description',
          description: 'The item condition does not match the listing.',
        }, customerToken);
        log('POST /reports', report.status || 201, report);

        const myReports = await request('GET', '/reports/my', undefined, customerToken);
        log('GET /reports/my', myReports.status || 200, myReports);
      }

      // 19. Create a support ticket
      if (customerToken) {
        const ticket = await request('POST', '/support-tickets', {
          subject: 'Payment issue',
          message: 'I was charged twice for my booking.',
          category: 'payments',
          priority: 'high',
        }, customerToken);
        log('POST /support-tickets', ticket.status || 201, ticket);

        const myTickets = await request('GET', '/support-tickets/my', undefined, customerToken);
        log('GET /support-tickets/my', myTickets.status || 200, myTickets);
      }

// 20. Refresh token flow
      if (customerToken && customerLogin.data?.refreshToken) {
        const refresh = await request('POST', '/auth/refresh', {
          refreshToken: customerLogin.data.refreshToken,
        });
        log('POST /auth/refresh', refresh.status || 200, refresh);
      }

      // 21. Payment flow (create order + mock verify)
      if (customerToken && bookingId) {
        const order = await request('POST', '/payments/create-order', {
          bookingId,
        }, customerToken);
        log('POST /payments/create-order', order.status || 200, order);

        if (order.data?.orderId) {
          const verify = await request('POST', '/payments/verify', {
            razorpay_order_id: order.data.orderId,
            razorpay_payment_id: 'pay_mock_123',
            razorpay_signature: 'mock_signature',
          }, customerToken);
          log('POST /payments/verify', verify.status || 200, verify);
        }
      }

      // 22. Owner verification flow
      if (ownerToken) {
        const verStatus = await request('GET', '/owner/verification', undefined, ownerToken);
        log('GET /owner/verification', verStatus.status || 200, verStatus);

        const submitVer = await request('POST', '/owner/verification', {
          storeName: 'Alex Rentals',
          storeDescription: 'Premium rental items',
          documentType: 'business_license',
          documentUrls: ['https://example.com/doc1.pdf'],
        }, ownerToken);
        // 201 = submitted, 409 = already pending (acceptable on re-run against same DB)
        const verOk = (submitVer.status || 201) === 201 || (submitVer.status || 201) === 409;
        console.log(`${verOk ? '✅' : '❌'} POST /owner/verification [${submitVer.status || 201}]`);
        if (!verOk) console.log('   ', JSON.stringify(submitVer).slice(0, 300));
      }

      // 23. Owner routes (listings, bookings, reviews, earnings)
      if (ownerToken) {
        const listings = await request('GET', '/owner/listings', undefined, ownerToken);
        log('GET /owner/listings', listings.status || 200, listings);

        const ownerBkgs = await request('GET', '/owner/bookings', undefined, ownerToken);
        log('GET /owner/bookings', ownerBkgs.status || 200, ownerBkgs);

        const ownerReviews = await request('GET', '/owner/reviews', undefined, ownerToken);
        log('GET /owner/reviews', ownerReviews.status || 200, ownerReviews);

        const earnings = await request('GET', '/owner/earnings', undefined, ownerToken);
        log('GET /owner/earnings', earnings.status || 200, earnings);
      }

      // 24. Admin routes (users, bookings, payments, categories, settings)
      if (adminToken) {
        const users = await request('GET', '/admin/users', undefined, adminToken);
        log('GET /admin/users', users.status || 200, users);

        const adminBkgs = await request('GET', '/admin/bookings', undefined, adminToken);
        log('GET /admin/bookings', adminBkgs.status || 200, adminBkgs);

        const adminPayments = await request('GET', '/admin/payments', undefined, adminToken);
        log('GET /admin/payments', adminPayments.status || 200, adminPayments);

        const adminCats = await request('GET', '/admin/categories', undefined, adminToken);
        log('GET /admin/categories', adminCats.status || 200, adminCats);

        const reports = await request('GET', '/admin/reports', undefined, adminToken);
        log('GET /admin/reports', reports.status || 200, reports);

        const tickets = await request('GET', '/admin/support-tickets', undefined, adminToken);
        log('GET /admin/support-tickets', tickets.status || 200, tickets);

        const verifications = await request('GET', '/admin/verifications', undefined, adminToken);
        log('GET /admin/verifications', verifications.status || 200, verifications);
      }

      // 25. Payment listing (customer)
      if (customerToken) {
        const myPayments = await request('GET', '/payments', undefined, customerToken);
        log('GET /payments', myPayments.status || 200, myPayments);
      }
    } else {
      console.log('⚠️ No categories found — skipping product creation');
    }
  }

  console.log('\nSmoke test complete.');
}

run().catch((e) => {
  console.error('Smoke test failed:', e.message);
  process.exit(1);
});

