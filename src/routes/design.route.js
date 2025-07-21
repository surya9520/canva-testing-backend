import Router from 'koa-router';
import { hello } from '../controllers/hello.js';
import {
  createDesign,
  navReturnHandler
} from '../controllers/design.controller.js';
import { validateUserToken } from '../middlewares/validateUser.js';
// import { hello } from '../controllers/hello.js';

const router = new Router();
router.post('/create-design',validateUserToken, createDesign);
router.post('/navReturn', navReturnHandler);
// router.get('/navReturn', hello);
export default router;
