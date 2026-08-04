import ApiError from '../utils/ApiError';
import DamageReportRepository from '../repositories/DamageReportRepository';
import BookingRepository from '../repositories/BookingRepository';
import notificationService from './notification.service';

export class DamageService {
  async createReport(userId: string, input: { bookingId: string; stage: string; photos: string[]; videos: string[]; comments: string; chargeEstimate: number; refundAmount: number; }) {
    const booking = await BookingRepository.findByIdPopulated(input.bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.owner._id.toString() !== userId && booking.renter._id.toString() !== userId) {
      throw new ApiError(403, 'You are not part of this booking');
    }

    const report = await DamageReportRepository.create({
      booking: booking.id as any,
      product: booking.product._id as any,
      owner: booking.owner._id as any,
      renter: booking.renter._id as any,
      reporter: userId as any,
      stage: input.stage as any,
      status: 'open',
      photos: input.photos,
      videos: input.videos,
      comments: input.comments,
      chargeEstimate: input.chargeEstimate,
      refundAmount: input.refundAmount,
      timeline: [{ status: 'open', note: 'Report created', timestamp: new Date() }],
    });

    void notificationService.createNotification({
      userId: booking.owner._id.toString(),
      type: 'admin',
      title: 'Damage reported',
      message: `A damage report has been submitted for booking ${booking.id}.`,
      link: `/owner/booking-requests`,
    });

    return report;
  }

  async updateReport(id: string, userId: string, input: { status: string; adminNote?: string; chargeEstimate?: number; refundAmount?: number }) {
    const report = await DamageReportRepository.findById(id);
    if (!report) throw new ApiError(404, 'Damage report not found');

    const updates: any = {};
    if (input.status) updates.status = input.status;
    if (input.adminNote !== undefined) updates.adminNote = input.adminNote;
    if (input.chargeEstimate !== undefined) updates.chargeEstimate = input.chargeEstimate;
    if (input.refundAmount !== undefined) updates.refundAmount = input.refundAmount;
    updates.timeline = [
      ...(report.timeline || []),
      { status: input.status as any, note: input.adminNote || 'Status updated', timestamp: new Date() },
    ];

    const updated = await DamageReportRepository.updateById(id, updates);
    if (!updated) throw new ApiError(500, 'Failed to update damage report');

    void notificationService.createNotification({
      userId: report.reporter.toString(),
      type: 'system',
      title: 'Damage report updated',
      message: `Your damage report for booking ${report.booking} has been updated to ${input.status}.`,
      link: '/dashboard/my-rentals',
    });

    return updated;
  }

  async getMyReports(userId: string) {
    return DamageReportRepository.listForUser(userId);
  }

  async getBookingReports(bookingId: string, userId: string) {
    const reports = await DamageReportRepository.findByBooking(bookingId);
    return reports.filter((report: any) => report.owner._id.toString() === userId || report.renter._id.toString() === userId || report.reporter._id.toString() === userId);
  }
}

export default new DamageService();
