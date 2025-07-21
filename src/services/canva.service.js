import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getTokenAndUpdate } from '../utils/accessTokenGeneration.js';
import { getDB } from '../databases/db.js';
dotenv.config();
export const createDesignOnCanva = async (ctx, isRetry = false) => {
  const { width, height } = ctx.request.body;
  const {type} = ctx.query
  console.log("dfjdsfjdsf",type)
  const { access_token, refresh_token, companyId } = ctx.sharedData;

  if (!width || !height) {
    ctx.status = 400;
    ctx.body = { error: "Width and height are required." };
    return;
  }

  const correlation_state=jwt.sign({companyId:ctx.sharedData.companyId,type},process.env.JWT_SECRET,);
  console.log(correlation_state)

  try {
    const canvaRes = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "User-Agent": "YourApp/1.0",
      },
      body: JSON.stringify({
        design_type: {
          type: "custom",
          width: Number(width),
          height: Number(height),
          unit: "px",
        },
        title: "My Custom Design",
        correlation_state:ctx.sharedData.companyId,
      }),
    });

    const canvaData = await canvaRes.json();

    // ✅ Handle token expired error
    if (!canvaRes.ok) {
      console.error("❌ Canva API error:", canvaData);

      if (canvaRes.status === 401 && !isRetry) {
        const tokenPayload = {
          grant_type: "refresh_token",
          refresh_token,
          client_id: process.env.CANVA_CLIENT_ID,
          client_secret: process.env.CANVA_CLIENT_SECRET,
        };

        await getTokenAndUpdate(tokenPayload, ctx, companyId);
        return await createDesignOnCanva(ctx, true);
      }

      ctx.status = canvaRes.status;
      ctx.body = { error: canvaData?.error || "Canva API Error" };
      return;
    }
  console.log("Edit url", canvaData.design.urls.edit_url);
    ctx.body = {
      design_id: canvaData.design.id,
      edit_url: `${canvaData.design.urls.edit_url}&correlation_state=${encodeURIComponent(correlation_state)}`,
    };
  } catch (err) {
    console.error("❌ createDesignOnCanva error:", err.message);
    ctx.status = 500;
    ctx.body = { error: "Internal Server Error: " + err.message };
  }
};


async function pollExportJob(
  exportId,
  accessToken,
  interval = 2000,
  maxAttempts = 20
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `https://api.canva.com/rest/v1/exports/${exportId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const data = await response.json();
    if (data.job.status === "success") return data.job.urls;
    if (data.job.status === "failed") throw new Error("Export failed");
    await new Promise((res) => setTimeout(res, interval));
  }
  throw new Error("Export timed out");
}

export const startExportAndRedirect = async (ctx) => {
  // const { correlation_jwt } = ctx.request.query;
  // console.log(ctx.body)
  const { correlation_jwt } = ctx.request.body;

  if (!correlation_jwt) {
    ctx.status = 400;
    ctx.body = "Missing correlation_jwt";
    return;
  }

  let decoded;
  try { 
    decoded = jwt.decode(correlation_jwt, { complete: true });
  } catch (err) {
    ctx.status = 400;
    ctx.body = "Invalid JWT";
    return;
  }

  console.log(decoded, "decoded jwt data");
  const {companyId,type} = jwt.verify(decoded?.payload?.correlation_state||{} , process.env.JWT_SECRET);
  console.log({companyId,type})

  let db=getDB();
  let users = db.collection("users");
  let user = await users.findOne({ companyId});
  if (!user) {
    ctx.status = 401;
    ctx.body = "User not authorized with Canva";
    return;
  }

  // 3. Extract the design_id from the JWT payload
  const designId = decoded?.payload?.design_id;

  if (!designId) {
    ctx.status = 400;
    ctx.body = "design_id not found in JWT";
    return;
  }
 try{
  let exportRes = await fetch(`https://api.canva.com/rest/v1/exports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_id: designId,
      format: {
        type: type === "image" ? "png" : "mp4",
        quality:type==="image"?"high":"horizontal_480p",
      },
    }),
  });
  const data = await exportRes.json();
  console.log(data, "data");
  if (!exportRes.ok) {
    throw new Error(
      `Export job creation failed: ${
        data.error?.message || exportRes.statusText
      }`
    );
  }
  let urls = await pollExportJob(data.job.id, user.access_token);
  urls = encodeURIComponent(urls[0]);
  // ctx.redirect(`http://localhost:5173/designPage?${type}_Urls=${urls}`);
  ctx.body = { [`${type}Url`]: urls };
  // ctx.body = {  urls };
}catch(err){
  console.error("❌ Failed to create export job:", err);
  ctx.status = 500;
  ctx.body = { error: "Internal Server Error: " + err.message };
}
};
