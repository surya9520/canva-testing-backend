import Router from 'koa-router';
import {oauthCallback, startOAuth} from "../controllers/auth.controller.js"
import { validateUserToken } from '../middlewares/validateUser.js';

const router = new Router();
router.get('/auth/canva',validateUserToken,startOAuth);
router.get('/callback', oauthCallback);
export default router;
