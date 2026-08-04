import { Router } from 'express';
import AIController from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// ---- Public AI endpoints (search intelligence, recommendations, pricing, description) ----

// Search intelligence
router.get('/search/semantic', AIController.semanticSearch);
router.get('/search/autocomplete', AIController.autocomplete);
router.get('/search/typo', AIController.correctTypo);
router.get('/search/related', AIController.relatedSearches);
router.get('/search/trending', AIController.trending);
router.get('/search/popular', AIController.popular);
router.get('/search/recent', AIController.recent);
router.post('/search/record', AIController.recordSearch);
router.post('/search/click', AIController.recordClick);

// Recommendations
router.get('/recommendations', AIController.recommendations);
router.get('/similar/:id', AIController.similarProducts);
router.get('/frequently-together', AIController.frequentlyRentedTogether);

// Pricing & description generator
router.post('/price-suggestion', AIController.priceSuggestion);
router.post('/description-generator', AIController.generateDescription);

// Image analysis (multipart upload, memory storage)
router.post('/image-analysis', upload.array('images', 10), AIController.analyzeImage);

// Fraud insights (public scoring endpoints; admin-only scan & alerts)
router.get('/fraud/user/:id', AIController.scoreUser);
router.get('/fraud/product/:id', AIController.scoreProduct);
router.get('/fraud/booking/:id', AIController.scoreBooking);
router.get('/fraud/review/:id', AIController.scoreReview);

// Owner insights (authenticated)
router.get('/owner-insights', authenticate, AIController.ownerInsights);

// ---- Admin-only AI endpoints ----
router.use('/admin', authenticate, authorize('admin'));
router.post('/admin/fraud-scan', AIController.scanFraud);
router.get('/admin/fraud-alerts', AIController.listFraudAlerts);
router.put('/admin/fraud-alerts/:id', AIController.updateFraudAlert);
router.get('/admin/dashboard', AIController.adminDashboard);

export default router;
