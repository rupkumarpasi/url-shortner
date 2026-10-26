import { db } from "../db/connect.js";
import { usersTable } from "../db/user.js";
import { and, eq, gt, lt, or, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import {
  emailVerficationTokenTable,
  forgotPasswordTokenTable,
  oauthAccountsTable,
  sessionTable,
} from "../db/urlshortner-user.js";
import { randomInt } from "node:crypto";

import { sharedService } from "./shared.service.js";
import { alias } from "drizzle-orm/pg-core";
import { asyncWrapProviders } from "node:async_hooks";

export class authService extends sharedService {
  async registerUser(data) {
    try {
      const [inserteddata] = await db.insert(usersTable).values(data).returning();
      if (inserteddata) {
        return {
          success: true,
          data: inserteddata,
        };
      } else {
        return {
          success: false,
          message: "cannot insert data",
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getByEmail(email) {
    // Fixed eq syntax (column, value)
    const userExist = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return userExist[0]; // returns the object or undefined
  }

  createAccessToken(payload) {
    return jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "15min",
    });
  }

  createRefreshToken(sessionId) {
    return jwt.sign({ sessionId }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });
  }

  async createSession({ userId, ip, userAgent }) {
    try {
      const [createdSession] = await db
        .insert(sessionTable)
        .values({ userId, userAgent, ip })
        .returning();
      return createdSession;
    } catch (err) {
      throw err;
    }
  }

  async getSessionById(id) {
    try {
      const [sessioninfo] = await db
        .select()
        .from(sessionTable)
        .where(eq(sessionTable.id, id));
      return sessioninfo;
    } catch (err) {
      throw err;
    }
  }

  async DeleteSessionById(sessionId) {
    const deletedResult = await db
      .delete(sessionTable)
      .where(eq(sessionTable.id, sessionId));
    console.log(deletedResult);
  }

  verifyToken(token) {
    return jwt.verify(token, process.env.SECRET_KEY);
  }

  generateToken(digit = 6) {
    let max = 10 ** digit;
    let min = 10 ** (digit - 1);

    return randomInt(min, max).toString();
  }

  async insertEmailToken({ userId, token }) {
    await db
      .delete(emailVerficationTokenTable)
      .where(lt(emailVerficationTokenTable.expiresAt, sql`NOW()`));

    await db
      .delete(emailVerficationTokenTable)
      .where(eq(emailVerficationTokenTable.userId, userId));

    const [insertedToken] = await db
      .insert(emailVerficationTokenTable)
      .values({ userId, token })
      .returning();
    return insertedToken;
  }

  verifyEmailTokenLink({ email, token }) {
    //url api  basename, url  you can see more info about url by consoling url object
    let url = new URL("verify-email-token", process.env.FRONTEND_URL);

    // console.log(url);
    url.searchParams.set("token", token);
    url.searchParams.set("email", email);
    // console.log(url.toString())
    return url.toString();

    //   const encodedEmail = encodeURIComponent(email);
    //  return `${process.env.FRONTEND_URL}/verfiy-email-token?token=${token}&email=${encodedEmail}`;
  }


  ///without join 
//  async verifyEmailToken({ email, token }) {
//   try {
//     // Optional: Since these are only SELECT queries, you can use `db` directly 
//     // instead of `db.transaction` to avoid unnecessary database locks.
    
//     // 1. Verify user and email match
//     const [verifyToken] = await db
//       .select(
//         {
//           token: emailVerficationTokenTable.token,
//           userId: emailVerficationTokenTable.userId,
//           expiresAt: emailVerficationTokenTable.expiresAt,
//           id: emailVerficationTokenTable.id
//         }
//       )
//       .from(emailVerficationTokenTable)
//       .where( and(
//         eq(emailVerficationTokenTable.token, token),
//          gt(emailVerficationTokenTable.expiresAt, sql`NOW()`),
//       ));

//     if (!verifyToken) {
//       console.log("not verified token in service");
//       return null;
//     }


//     const [userInfo] = await db.select( {
//       email: usersTable.email
//     } ).from(usersTable).where(and (
//       eq(usersTable.id,verifyToken.userId),
// eq(usersTable.email,email)
//     ))

//     if(!userInfo)
//     {
//       return null;
//     }
   

//     return{
//       userId: verifyToken.userId,
//       email: userInfo.email,
//       token: verifyToken.token,
//       expiresAt: verifyToken.expiresAt,
//       tokenId : verifyToken.id

//     }

//     // 2. Verify token matches and has NOT expired (gt = greater than NOW())
//     // const [verifyToken] = await db
//     //   .select()
//     //   .from(emailVerficationTokenTable)
//     //   .where(
//     //     and(
//     //       eq(emailVerficationTokenTable.userId, userId),
//     //       eq(emailVerficationTokenTable.token, token),
//     //       gt(emailVerficationTokenTable.expiresAt, sql`NOW()`), // FIXED: changed lt to gt
//     //     ),
//     //   );

//     // 3. FIXED: Destructuring `[verifyToken]` means it will be `undefined` if no row matches
//     // if (!verifyToken) {
//     //   console.log("not verified token in service");
//     //   return false;
//     // }

//     // console.log("verified token in service");
//     // return true;

//   } catch (err) {
//     console.log(err);
//     throw err;
//   }
// }

  async updateEmailValid(email, isemailvalid) {
   const [updated]=  await db
      .update(usersTable)
      .set({ isEmailValid: isemailvalid })
      .where(eq(usersTable.email, email)).returning();

      if(updated)
      {
        return true;
      }
      else
      {
        return false;
      }
  }


  async clearToken(tokenId)
  {
    return await db.delete(emailVerficationTokenTable).where(eq(emailVerficationTokenTable.id,tokenId))
  }

//update password by user id

async updatePassword({userId,password})
{
  return db.update(usersTable).set({password}).where(eq(usersTable.id,userId));
}


async updateUser(user)
{
  return db.update(usersTable).set({username: user.username,avatar: user.avatar}).where(eq(usersTable.id,user.userId));
}



// forgot password functionality here

async insertForgotToken({hashedToken,userId})
{
  try{
const transaction = await db.transaction(async(tx)=>{

    await tx.delete(forgotPasswordTokenTable).where(or
      (eq(forgotPasswordTokenTable.userId,userId)),
      lt(forgotPasswordTokenTable.expiresAt,sql`NOW()`)
    )

    const [insertedToken] = await tx.insert(forgotPasswordTokenTable)
    .values({hashToken: hashedToken, userId}).returning();
     return insertedToken
  });
  return transaction;
  }catch(err)
  {
    console.error(err);
throw err;

  }
  
}


resetLink(hashedToken)
{
  const url = new URL(`reset-password/${hashedToken}`,process.env.FRONTEND_URL);
  console.log("reset link url: ",url);

  return url.toString();
   
}

async getUserByForgotToken(token)
{
  const f = alias(forgotPasswordTokenTable,'f');
  const u = alias(usersTable,'u');
  const [user] =  await db.select({
    userId: f.userId,
    tokenId : f.id,
    hashToken: f.hashToken,
    email: u.email
  }).from(f).innerJoin(u,eq(f.userId,u.id))
  .where(
    and (
    eq(f.hashToken,token),
    gt(f.expiresAt,sql`NOW()`)
    )
  );

  return user;
}


async deleteForgotTokenById(tokenId)
{
  return db.delete(forgotPasswordTokenTable).where(eq(forgotPasswordTokenTable.id,tokenId))
}





/// sign it with google

async findOAuthByGoogleId({provider,providerAccountId})
{
 const [oauthData] = await db.select().from(oauthAccountsTable).where(and(
  eq(oauthAccountsTable.providerAccountId,providerAccountId),
  eq(oauthAccountsTable.provider,provider)
 ));

 return oauthData;
}



async registerUserWithGoogleOauth({
 email,
  username,
    isEmailValid,
    providerAccountId,
    provider
})
{
const transaction = await db.transaction(async(tx) => {  // <-- Look here: (tx) is required!
  
  const [registerUserData] = await tx.insert(usersTable)
    .values({ username, email, isEmailValid })
    .returning();
    
  const [linkWithOauth] = await tx.insert(oauthAccountsTable)
    .values({ userId: registerUserData.id, providerAccountId, provider })
    .returning();
    
  return {
    userId: registerUserData.id,
    email: registerUserData.email,
    isEmailValid: registerUserData.isEmailValid,
    oauthId: linkWithOauth.id,
    provider: linkWithOauth.provider,
    providerAccountId: linkWithOauth.providerAccountId
  };
});

return transaction;
}



async referenceUserWithOauth( {userId,
    providerAccountId,
    provider})
{
 const [linkWithOauth] = await db.insert(oauthAccountsTable).values({userId,providerAccountId,provider}).returning();
 return linkWithOauth;
}


}

//with join
export const verifyEmailToken = async({email,token})=>
{

  const t = alias(emailVerficationTokenTable,"tokenTable");
  const u = alias(usersTable,"userTable");

  const [userinfo] = await db.select({
userId: t.userId,
expiresAt: t.expiresAt,
email: u.email,
tokenId: t.id,
token: t.token
}).from(t).innerJoin(u, eq(u.id,t.userId)).where( and(
  eq(t.token,token),
  gt(t.expiresAt, sql`NOW()`),
  eq(u.email,email)
));

return userinfo;
}



export const getByEmail=async(email)=> {
    // Fixed eq syntax (column, value)
    const userExist = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return userExist[0]; // returns the object or undefined
  }

 export const createAccessToken=(payload)=>{
    return jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "15min",
    });
  }

  export const createRefreshToken=(sessionId)=>{
    return jwt.sign({ sessionId }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });
  };

  export const createSession =async({ userId, ip, userAgent })=> {
    try {
      const [createdSession] = await db
        .insert(sessionTable)
        .values({ userId, userAgent, ip })
        .returning();
      return createdSession;
    } catch (err) {
      throw err;
    }
  }

   export const getSessionById=async(id)=>{
    try {
      const [sessioninfo] = await db
        .select()
        .from(sessionTable)
        .where(eq(sessionTable.id, id));
      return sessioninfo;
    } catch (err) {
      throw err;
    }
  }

  export const DeleteSessionById=async(sessionId) =>{
    const deletedResult = await db
      .delete(sessionTable)
      .where(eq(sessionTable.id, sessionId));
    console.log(deletedResult);
  }

  export const authenticationComplete = async({userId,username,email,req,res})=>{
     const session = await createSession({
  userId: userId,
  ip: req.clientIp,
  userAgent : req.headers["user-agent"]
});

   const payload = {
        id: userId,
        username: username,
        email: email,
        sessionId: session.id
      };


const accessToken = createAccessToken(payload);


const refreshToken = createRefreshToken(session.id);


      
 res.cookie('access_token', accessToken, {
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite:"lax", // Use 'lax' or 'strict' depending on your frontend/backend setup
    encode: (val) => val // Prevents any automatic encoding interference
});


               res.cookie('refresh_token', refreshToken, {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days 
          httpOnly: true , // cookie is not accessed by javascript
          secure: true ,
          sameSite: "lax"      // Recommended security flag only send information only on secured s version
      });

      return res.redirect("/");


  }




 