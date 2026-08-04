import { Response } from 'express';
import BookingService from '../services/booking.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class BookingController {
  createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await BookingService.createBooking(req.user!.id, req.body);
    res.status(201).json(ApiResponse.ok(booking, 'Booking request created'));
  });

  getMyBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const bookings = await BookingService.listMyBookings(req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(bookings));
  });

  getBookingById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await BookingService.getBookingById(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(booking));
  });

  updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await BookingService.updateBookingStatus(
      req.params.id,
      req.user!.id,
      req.body.status,
      req.body.reason
    );
    res.status(200).json(ApiResponse.ok(booking, 'Booking updated'));
  });

  cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await BookingService.cancelBooking(req.params.id, req.user!.id, req.body.reason);
    res.status(200).json(ApiResponse.ok(booking, 'Booking cancelled'));
  });

  updateDeliveryStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await BookingService.updateDeliveryStatus(req.params.id, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(booking, 'Delivery status updated'));
  });

  verifyDeliveryOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await BookingService.verifyDeliveryOtp(req.params.id, req.user!.id, req.body.deliveryOtp);
    res.status(200).json(ApiResponse.ok(booking, 'Delivery OTP verified'));
  });

  getOwnerBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const bookings = await BookingService.listOwnerBookings(req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(bookings));
  });
}

export default new BookingController();

