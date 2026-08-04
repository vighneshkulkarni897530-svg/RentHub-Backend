import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import Booking, { IBooking } from '../models/Booking';
import BaseRepository from './BaseRepository';

const bookingPopulate: PopulateOptions[] = [
  { path: 'product', select: 'title slug images rentalPrice priceUnit location' },
  { path: 'renter', select: 'name avatar phone email rating' },
  { path: 'owner', select: 'name avatar phone email rating' },
];

class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(Booking);
  }

  async findByIdPopulated(id: string): Promise<IBooking | null> {
    return Booking.findById(id).populate(bookingPopulate).exec();
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
    return this.paginate(filter, options);
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

