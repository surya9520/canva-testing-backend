import { generatePKCECodes } from '../utils/pkce.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getTokenAndUpdate } from '../utils/accessTokenGeneration.js';
dotenv.config();

let PKCE_MAP = new Map();

 export const startOAuth = async (ctx) => {

  const { code_verifier, code_challenge } = generatePKCECodes();
    const state = crypto.randomBytes(16).toString('hex');
    PKCE_MAP.set(state, { code_verifier, companyId: ctx.sharedData.companyId });
    const scope = 'app:read%20app:write%20asset:read%20asset:write%20brandtemplate:content:read%20brandtemplate:meta:read%20comment:read%20comment:write%20design:content:read%20design:content:write%20design:permission:read%20design:permission:write%20folder:read%20folder:write%20folder:permission:read%20folder:permission:write%20profile:read'
  
    const authUrl = `https://www.canva.com/api/oauth/authorize?response_type=code&client_id=${process.env.CANVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.CANVA_REDIRECT_URI)}&scope=${scope}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;
  
    ctx.body = { authUrl };
};

 export const oauthCallback = async (ctx) => {
  const { code,state} = ctx.query;
    const {code_verifier,companyId} = PKCE_MAP.get(state);
    if (!code_verifier) return ctx.throw(400, 'Invalid or expired state');
    let data={
       client_id: process.env.CANVA_CLIENT_ID,
        client_secret: process.env.CANVA_CLIENT_SECRET,
        redirect_uri: process.env.CANVA_REDIRECT_URI,
       grant_type: 'authorization_code',
       code_verifier,
       code,
       state
    };
   await getTokenAndUpdate(data,ctx,companyId);
  
    PKCE_MAP.delete(state);
  
    // Redirect to frontend
    ctx.redirect(`https://canva-testing-frontend.vercel.app/success`);
};


