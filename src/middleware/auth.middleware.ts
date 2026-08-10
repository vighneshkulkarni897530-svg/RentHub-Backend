import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'renthub-development-secret-change-later';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    // Attach user to the request object
    // @ts-ignore
    req.user = currentUser;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};