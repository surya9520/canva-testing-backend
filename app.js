import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './src/routes/index.js';
import { validateUserToken } from './src/middlewares/validateUser.js';
const app = new Koa();
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser());

app.use(router.routes()).use(router.allowedMethods());
export default app;
