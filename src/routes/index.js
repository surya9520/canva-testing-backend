import Router from 'koa-router';
import authRoutes from './auth.route.js';
import designRoutes from './design.route.js';

const router = new Router();
router.use(authRoutes.routes());
router.use(designRoutes.routes());
export default router;
