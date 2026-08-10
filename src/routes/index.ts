import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

const apiV1Router = Router();
apiV1Router.use('/auth', authRoutes);

router.use('/api/v1', apiV1Router);

export default router;