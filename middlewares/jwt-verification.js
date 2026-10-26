import { authService } from "../service/auth.service.js";
import { sharedService } from "../service/shared.service.js";

// export const verifyJwtToken = (req,res,next)=>{
// const service = new authService();
//     const token = req.cookies.token;

//     if(!token){
//         req.user = null;
//         return next();
//     }

//     try{

//         const decoded = service.verifyToken(token);
//         console.log(decoded);
//         req.user = decoded;
//     }catch(error)
//     {
//          req.user = null;
//         return next();
//     }

//     return next();
// }

export const verifyJwtToken = async(req, res, next) => {
  const service = new authService();
  const sharedservice = new sharedService();
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  req.user = null;
  if (!accessToken && !refreshToken) {
    return next();
  }

  if (accessToken) {
    try{
    
  const decoded = service.verifyToken(accessToken);
     
      req.user = decoded; 
      return next();
    }
    catch(err)
    {
       res.clearCookie('access_token');
    }
  }

  if(refreshToken)
  {
    try{
  const decodedRefreshToken = service.verifyToken(refreshToken);

    const sessiondata = await service.getSessionById(decodedRefreshToken.sessionId);

    const user = await sharedservice.getUserById(sessiondata.userId);

    // create accessToken
    const payload = {
        id : user.id,
        username: user.username,
        email: user.email,
        sessionId: sessiondata.id
    }

    const createAccessToken = service.createAccessToken(payload);

        res.cookie('access_token', createAccessToken, {
          maxAge: 15 * 60 * 1000, // 15 min
          httpOnly: true , // cookie is not accessed by javascript
          secure: true,     // Recommended security flag only send information only on secured s version
          //  sameSite: 'lax' //The cookie is blocked on hidden cross-site requests (forms, images, API fetches) but allowed when a user actively clicks a standard link to visit your site.
     
     sameSite: "strict"  //  The cookie is never sent from external links. If a user clicks a link to your app from Google or an email, they will arrive logged out and must refresh or re-login.
        });

      req.user = payload;

    }
    catch(err)
    {
        res.clearCookie('refresh_token');
        return next();
    }
  }

  return next();
};
