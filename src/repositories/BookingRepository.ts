import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import Booking, { IBooking } from '../models/Booking';
import BaseRepository from './BaseRepository';
import PurchaseRequest from '../models/PurchaseRequest';

const bookingPopulate: PopulateOptions[] = [
  { path: 'product', select: 'title slug images rentalPrice priceUnit location saleEnabled salePrice purchaseCondition productStatus' },
  { path: 'renter', select: 'name avatar phone email rating' },
  { path: 'owner', select: 'name avatar phone email rating' },
];

/** Attach the latest active purchase-request status to each booking. */
async function attachPurchaseRequestStatus(bookings: IBooking[]): Promise<IBooking[]> {
  if (!bookings.length) return bookings;
  const bookingIds = bookings.map((b) => b._id as Types.ObjectId);
  const requests = await PurchaseRequest.find({
    rentalId: { $in: bookingIds },
    status: { $in: ['pending', 'accepted', 'rejected'] },
  })
    .sort({ createdAt: -1 })
    .exec();

  const statusByBooking = new Map<string, string>();
  for (const r of requests) {
    const key = String(r.rentalId);
    if (!statusByBooking.has(key)) statusByBooking.set(key, r.status);
  }

  return bookings.map((b) => {
    const status = statusByBooking.get(String(b._id));
    if (status) {
      (b as any).purchaseRequestStatus = status;
    }
    return b;
  });
}

class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(Booking);
  }

  async findByIdPopulated(id: string): Promise<IBooking | null> {
    const booking = await Booking.findById(id).populate(bookingPopulate).exec();
    if (!booking) return null;
    const [withStatus] = await attachPurchaseRequestStatus([booking]);
    return withStatus;
  }

  async findOverlapping(productId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<IBooking[]> {
    const filter: FilterQuery<IBooking> = {
      product: productId as unknown as Types.ObjectId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    };
    if (excludeId) filter._id = { $ne: excludeId };
    return this.find(filter);
  }

  async listForUser(
    userId: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const filter: FilterQuery<IBooking> = { renter: userId as unknown as Types.ObjectId };
    if (options.status) filter.status = options.status as IBooking['status'];
    const result = await this.paginate(filter, options);
    result.data = await attachPurchaseRequestStatus(result.data);
    return result;
  }

  async listForOwner(
    ownerId: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const filter: FilterQuery<IBooking> = { owner: ownerId as unknown as Types.ObjectId };
    if (options.status) filter.status = options.status as IBooking['status'];
    return this.paginate(filter, options);
  }

  async listAll(options: { page?: number; limit?: number; status?: string }) {
    const filter: FilterQuery<IBooking> = {};
    if (options.status) filter.status = options.status as IBooking['status'];
    return this.paginate(filter, options);
  }

  private async paginate(filter: FilterQuery<IBooking>, options: { page?: number; limit?: number; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: bookingPopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async countByStatus(status: string): Promise<number> {
    return this.countDocuments({ status: status as IBooking['status'] });
  }
}

export default new BookingRepository();

