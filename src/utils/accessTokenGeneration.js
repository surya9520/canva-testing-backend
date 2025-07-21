import { getDB } from "../databases/db.js";

export const getTokenAndUpdate = async (data, ctx, companyId) => {
  try {
    const basicAuth = Buffer.from(`${data.client_id}:${data.client_secret}`).toString("base64");

    const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams(data),
    });

    const tokenData = await tokenRes.json();
    console.log("tokenData", tokenData);

    if (!tokenRes.ok) {
      console.error("❌ Token refresh failed:", tokenData);
      throw new Error(tokenData.error_description || "Failed to refresh token");
    }

    const db = getDB();
    const users = db.collection("users");

    // Update user's token data
    await users.updateOne({ companyId }, { $set: { ...tokenData } }, { upsert: true });
    ctx.sharedData={};

    // Attach new token to sharedData
    ctx.sharedData.access_token = tokenData.access_token;
    ctx.sharedData.refresh_token = tokenData.refresh_token;
  } catch (err) {
    console.error("❌ getTokenAndUpdate error:", err.message);
    ctx.status = 500;
    ctx.body = { error: "Token update failed: " + err.message };
    throw err;
  }
};
