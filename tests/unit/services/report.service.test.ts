// ReportService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/ReportRepository', () => ({
  default: {
    create: vi.fn(),
    listAll: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
  },
}));

import ReportService from '../../../src/services/report.service';
import ReportRepository from '../../../src/repositories/ReportRepository';

const mockReport = {
  _id: 'rep1',
  type: 'product',
  reportedItemId: 'prod1',
  reporter: 'user1',
  reason: 'misleading',
  status: 'open',
  priority: 'medium',
  resolvedAt: undefined,
  adminResolution: undefined,
  timeline: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReportService', () => {
  describe('createReport', () => {
    it('creates a report', async () => {
      (ReportRepository.create as any).mockResolvedValue(mockReport);
      const result = await ReportService.createReport('user1', {
        type: 'product',
        reportedItemId: 'prod1',
        reason: 'misleading',
      });
      expect(result).toBeDefined();
      expect(ReportRepository.create).toHaveBeenCalled();
    });
  });

  describe('listReports', () => {
    it('lists reports', async () => {
      (ReportRepository.listAll as any).mockResolvedValue([mockReport]);
      const result = await ReportService.listReports({});
      expect(result).toEqual([mockReport]);
    });
  });

  describe('getMyReports', () => {
    it('returns user reports', async () => {
      (ReportRepository.findByUser as any).mockResolvedValue([mockReport]);
      const result = await ReportService.getMyReports('user1');
      expect(result).toEqual([mockReport]);
    });
  });

  describe('updateReportStatus', () => {
    it('updates report status', async () => {
      (ReportRepository.findById as any).mockResolvedValue(mockReport);
      (ReportRepository.updateById as any).mockResolvedValue({ ...mockReport, status: 'resolved' });
      const result = await ReportService.updateReportStatus('rep1', 'resolved', 'admin1');
      expect(result).toBeDefined();
      expect(ReportRepository.updateById).toHaveBeenCalled();
    });

    it('throws 404 when report not found', async () => {
      (ReportRepository.findById as any).mockResolvedValue(null);
      await expect(ReportService.updateReportStatus('rep1', 'resolved', 'admin1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
