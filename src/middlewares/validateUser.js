import { getDB } from "../databases/db.js";

 export const validateUserToken = async(ctx,next) => {
  console.log("i am here")
   const token = ctx.request.headers.authorization?.split(' ')[1];
   const db= getDB();
   const users = db.collection('users');
   console.log(token)
   const user = await users.findOne({ companyId: token });
   console.log("user",user)

   if (!user) {
    ctx.status = 401;
    ctx.body = { error: 'User not authorized with Canva' };
    return;
  }
  ctx.sharedData= user

  // ctx.sharedData.user = user;
  await next(); 
}

