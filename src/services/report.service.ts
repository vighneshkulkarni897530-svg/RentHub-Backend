import ApiError from '../utils/ApiError';
import ReportRepository from '../repositories/ReportRepository';
import { CreateReportInput } from '../validators/report';

export class ReportService {
  async createReport(userId: string, input: CreateReportInput) {
    const report = await ReportRepository.create({
      type: input.type,
      reportedItemId: input.reportedItemId as any,
      reporter: userId as any,
      reason: input.reason,
      description: input.description || '',
      evidenceUrls: input.evidenceUrls || [],
      timeline: [
        {
          status: 'open',
          note: 'Complaint submitted',
          timestamp: new Date(),
        },
      ],
    });
    return report;
  }

  async listReports(options: any) {
    return ReportRepository.listAll(options);
  }

  async getMyReports(userId: string) {
    return ReportRepository.findByUser(userId);
  }

  async updateReportStatus(id: string, status: string, adminId: string, priority?: string, adminResolution?: string) {
    const report = await ReportRepository.findById(id);
    if (!report) throw new ApiError(404, 'Report not found');
    const timelineEntry = {
      status: status as any,
      note: adminResolution || `Status changed to ${status}`,
      timestamp: new Date(),
    };
    return ReportRepository.updateById(id, {
      status,
      priority: priority || report.priority,
      resolvedBy: adminId as any,
      resolvedAt: status === 'resolved' ? new Date() : report.resolvedAt,
      adminResolution: adminResolution || report.adminResolution,
      timeline: [...(report.timeline || []), timelineEntry],
    });
  }
}

export default new ReportService();

