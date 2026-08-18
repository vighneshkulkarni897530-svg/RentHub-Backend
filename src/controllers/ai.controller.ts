import { Response } from 'express';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';
import semanticSearchService from '../services/ai/semantic.service';
import smartSearchService from '../services/ai/search.service';
import recommendationService from '../services/ai/recommendation.service';
import pricingService from '../services/ai/pricing.service';
import descriptionService from '../services/ai/description.service';
import imageAnalysisService from '../services/ai/image.service';
import fraudService from '../services/ai/fraud.service';
import insightsService from '../services/ai/insights.service';
import { handleAssistantRequest } from '../services/ai/assistant';

export class AIController {
  // ================= VOICE ASSISTANT =================
  assistant = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await handleAssistantRequest(
      {
        message: req.body.message,
        conversationId: req.body.conversationId,
        context: req.body.context,
      },
      req.user ? { id: req.user.id, role: req.user.role } : undefined
    );
    res.status(200).json(ApiResponse.ok(result.data, result.success ? undefined : result.data.message));
  });
  // ================= SEARCH =================
  semanticSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = String(req.query.q || '');
    const result = await semanticSearchService.semanticSearch(query, {
      limit: Number(req.query.limit) || 20,
      sort: req.query.sort as string,
    });
    res.status(200).json(ApiResponse.ok(result));
  });

  autocomplete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const term = String(req.query.q || '');
    const result = await smartSearchService.autocomplete(term, req.user?.id, Number(req.query.limit) || 8);
    res.status(200).json(ApiResponse.ok(result));
  });

  correctTypo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const term = String(req.query.q || '');
    const result = await smartSearchService.correctTypo(term, Number(req.query.limit) || 5);
    res.status(200).json(ApiResponse.ok(result));
  });

  relatedSearches = asyncHandler(async (req: AuthRequest, res: Response) => {
    const term = String(req.query.q || '');
    const result = await smartSearchService.relatedSearches(term, Number(req.query.limit) || 6);
    res.status(200).json(ApiResponse.ok(result));
  });

  trending = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const result = await smartSearchService.trending(Number(_req.query.limit) || 10);
    res.status(200).json(ApiResponse.ok(result));
  });

  popular = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const result = await smartSearchService.popular(Number(_req.query.limit) || 10);
    res.status(200).json(ApiResponse.ok(result));
  });

  recent = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      return res.status(200).json(ApiResponse.ok([]));
    }
    const result = await smartSearchService.recent(req.user.id, Number(req.query.limit) || 10);
    res.status(200).json(ApiResponse.ok(result));
  });

  recordSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await smartSearchService.recordSearch({
      query: req.body.query,
      userId: req.user?.id,
      sessionId: req.body.sessionId,
      resultCount: req.body.resultCount,
      category: req.body.category,
      location: req.body.location,
      source: req.body.source,
    });
    res.status(200).json(ApiResponse.ok(result));
  });

  recordClick = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await smartSearchService.recordClick({
      query: req.body.query,
      productId: req.body.productId,
      userId: req.user?.id,
      sessionId: req.body.sessionId,
    });
    res.status(200).json(ApiResponse.ok(result));
  });

  // ================= RECOMMENDATIONS =================
  recommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      const popular = await recommendationService.popularProducts(Number(req.query.limit) || 12);
      return res.status(200).json(ApiResponse.ok({ products: popular, reason: 'popular' }));
    }
    const exclude = req.query.exclude ? String(req.query.exclude).split(',') : [];
    const result = await recommendationService.getRecommendations(req.user.id, {
      limit: Number(req.query.limit) || 12,
      exclude,
    });
    res.status(200).json(ApiResponse.ok(result));
  });

  similarProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await recommendationService.similarProducts(req.params.id, Number(req.query.limit) || 8);
    res.status(200).json(ApiResponse.ok(result));
  });

  frequentlyRentedTogether = asyncHandler(async (req: AuthRequest, res: Response) => {
    const ids = req.query.productIds ? String(req.query.productIds).split(',') : [];
    const result = await recommendationService.frequentlyRentedTogether(ids, Number(req.query.limit) || 8);
    res.status(200).json(ApiResponse.ok(result));
  });

  // ================= PRICING =================
  priceSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await pricingService.suggestPrice(req.body);
    res.status(200).json(ApiResponse.ok(result));
  });

  // ================= DESCRIPTION GENERATOR =================
  generateDescription = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = descriptionService.generate(req.body);
    res.status(200).json(ApiResponse.ok(result));
  });

  // ================= IMAGE ANALYSIS =================
  analyzeImage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const result = await imageAnalysisService.analyzeImages(
      files.map((f) => ({ buffer: f.buffer, filename: f.originalname }))
    );
    res.status(200).json(ApiResponse.ok(result));
  });

  // ================= FRAUD =================
  scoreUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await fraudService.scoreUser(req.params.id);
    res.status(200).json(ApiResponse.ok(result));
  });

  scoreProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await fraudService.scoreProduct(req.params.id);
    res.status(200).json(ApiResponse.ok(result));
  });

  scoreBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await fraudService.scoreBooking(req.params.id);
    res.status(200).json(ApiResponse.ok(result));
  });

  scoreReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await fraudService.scoreReview(req.params.id);
    res.status(200).json(ApiResponse.ok(result));
  });

  scanFraud = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const result = await fraudService.scanAndCreateAlerts({ limit: Number(_req.query.limit) || 20 });
    res.status(200).json(ApiResponse.ok(result));
  });

  listFraudAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await fraudService.listAlerts({
      status: req.query.status as string,
      limit: Number(req.query.limit) || 50,
      skip: Number(req.query.skip) || 0,
    });
    res.status(200).json(ApiResponse.ok(result));
  });

  updateFraudAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await fraudService.updateAlertStatus(req.params.id, req.body.status, req.user?.id);
    res.status(200).json(ApiResponse.ok(result, 'Fraud alert updated'));
  });

  // ================= INSIGHTS =================
  ownerInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json(ApiResponse.ok(null));
    }
    const result = await insightsService.ownerInsights(req.user.id);
    res.status(200).json(ApiResponse.ok(result));
  });

  adminDashboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const result = await insightsService.adminDashboard();
    res.status(200).json(ApiResponse.ok(result));
  });
}

export default new AIController();
