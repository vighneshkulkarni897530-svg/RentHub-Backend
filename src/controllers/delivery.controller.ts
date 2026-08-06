import { Response } from 'express';
import DeliveryService from '../services/delivery.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class DeliveryController {
  createPartner = asyncHandler(async (req: AuthRequest, res: Response) => {
    const partner = await DeliveryService.createPartner(req.body);
    res.status(201).json(ApiResponse.ok(partner, 'Delivery partner created'));
  });

  getPartners = asyncHandler(async (req: AuthRequest, res: Response) => {
    const partners = await DeliveryService.listPartners(req.user!.role, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      zone: req.query.zone as string | undefined,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(partners));
  });

  updatePartner = asyncHandler(async (req: AuthRequest, res: Response) => {
    const partner = await DeliveryService.updatePartner(req.params.id, req.body);
    res.status(200).json(ApiResponse.ok(partner, 'Partner updated'));
  });

  assignPartner = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await DeliveryService.assignPartner(req.params.id, req.user!.id, req.body.partnerId);
    res.status(200).json(ApiResponse.ok(booking, 'Partner assigned'));
  });

  schedulePickup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await DeliveryService.schedulePickup(req.params.id, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(booking, 'Pickup scheduled'));
  });

  updateDeliveryStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await DeliveryService.updateDeliveryStatus(req.params.id, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(booking, 'Delivery status updated'));
  });

  generateOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await DeliveryService.generateOtp(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(result, 'OTP generated'));
  });

  verifyOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await DeliveryService.verifyOtp(req.params.id, req.user!.id, req.body.otp);
    res.status(200).json(ApiResponse.ok(booking, 'OTP verified'));
  });

  initiateReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await DeliveryService.initiateReturn(req.params.id, req.user!.id, req.body?.note);
    res.status(200).json(ApiResponse.ok(booking, 'Return pickup initiated'));
  });

  confirmReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await DeliveryService.confirmReturn(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(booking, 'Return confirmed'));
  });

  getTimeline = asyncHandler(async (req: AuthRequest, res: Response) => {
    const timeline = await DeliveryService.getTimeline(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(timeline));
  });
}

export default new DeliveryController();
