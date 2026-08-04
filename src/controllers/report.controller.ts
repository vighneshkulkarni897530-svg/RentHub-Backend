import { Response } from 'express';
import ReportService from '../services/report.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class ReportController {
  createReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await ReportService.createReport(req.user!.id, req.body);
    res.status(201).json(ApiResponse.ok(report, 'Report submitted'));
  });

  getMyReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reports = await ReportService.getMyReports(req.user!.id);
    res.status(200).json(ApiResponse.ok(reports));
  });

  updateReportStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await ReportService.updateReportStatus(
      req.params.id,
      req.body.status,
      req.user!.id,
      req.body.priority
    );
    res.status(200).json(ApiResponse.ok(report, 'Report updated'));
  });
}

export default new ReportController();

