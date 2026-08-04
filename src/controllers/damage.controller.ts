import { Response } from 'express';
import DamageService from '../services/damage.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class DamageController {
  createDamageReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await DamageService.createReport(req.user!.id, req.body);
    res.status(201).json(ApiResponse.ok(report, 'Damage report created'));
  });

  updateDamageReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await DamageService.updateReport(req.params.id, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(report, 'Damage report updated'));
  });

  getMyReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reports = await DamageService.getMyReports(req.user!.id);
    res.status(200).json(ApiResponse.ok(reports));
  });

  getBookingReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reports = await DamageService.getBookingReports(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(reports));
  });
}

export default new DamageController();
