import fs from "node:fs/promises";
import { sendMail } from "../lib/resendMail.js";
import { authService, verifyEmailToken } from "../service/auth.service.js";
import { changePasswordSchema, editProfileSchema, emailVerificationSchema, postEmailVerificationSchema, resetPasswordSchema } from "../validations/auth-validation.js";
import path from "node:path";
import mjml2html from "mjml";
import ejs from "ejs"
import { generateTokenHash, hashPassword, verifyPassword } from "../hash_password.js";
import crypto from "node:crypto";

export class ProfileController{
constructor()
{
    this.authservice = new authService();
}
 
    getProfilePage= async(req,res)=>{
        if(!req.user)
        {
            return res.redirect("/auth/login");
        }
console.log(req.user);
        const user = await this.authservice.getUserById(req.user.id);


        const shortLinks = await this.authservice.getAllUrls(req.user.id);

        console.log("userId",user.id);

       return res.render("auth/profile",{
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            isEmailValid: user.isEmailValid,
            links: shortLinks,
            avatar: user.avatar,
            hashPassword: Boolean(user.password)
        }
       });
    }




    getVerifyEmailPage= async (req,res)=>{
        if(!req.user) return res.redirect("/auth/login");

        const user = await this.authservice.getUserById(req.user.id);

        if(!user) return res.redirect("/auth/login");

        return res.render("auth/verify-email",{user,errors: req.flash("errors")});

    }



    resendVerificationCode= async (req,res)=>{
 if(!req.user) return res.redirect("/auth/login");

        const user = await this.authservice.getUserById(req.user.id);

        if(!user) return res.redirect("/auth/login");

        const randomToken = this.authservice.generateToken();

        const insertToken = await this.authservice.insertEmailToken({userId: req.user.id, token:randomToken});

        const verifyTokenLink =  this.authservice.verifyEmailTokenLink({email: req.user.email,token: randomToken});

const emailPath= path.join(import.meta.dirname,"..","email","email.mjml");


const readMjmlFile = await fs.readFile(emailPath,"utf-8");

const passPlaceholder = ejs.render(readMjmlFile,{
    token:randomToken,
    link:verifyTokenLink
});

const mjmlToHTML = (await mjml2html(passPlaceholder)).html;



        sendMail({
            to: req.user.email,
            subject: "verify your Email from the below given info",
    //         html: ` <div class="container">
    // <h2>Verify Your Email</h2>
    // <p>Thank you for signing up! Use the verification code below to complete your registration:</p>
    // <div class="code">${randomToken}</div> <br> OR verify using link below: <br>
    // <a href="${verifyTokenLink}">verify your email</a>
    // <p>This code will expire in 10 minutes.</p>
    // <div class="footer">
    //   If you didn't request this, you can safely ignore this email.
    // </div>`
    html: mjmlToHTML
        });
    //   return res.redirect("/verify-email")
    }


    postVerifiedCode= async(req,res)=>{
        console.log("token not verified")
         if(!req.user) return res.redirect("/auth/login");
let {data,error}=  postEmailVerificationSchema.safeParse(req.query);
if(error)
{
return res.redirect("/verify-email");
}

const verifyEmail = await verifyEmailToken({
    email: data.email,
    token: data.token
});
console.log(verifyEmail);

if(!verifyEmail)
{
    req.flash("errors","email not verified,might have expired token");
    return res.redirect("/verify-email");

}

  const updatedisEmail = await this.authservice.updateEmailValid(verifyEmail.email,true);

  if(updatedisEmail)
  {
  const clearToken = await this.authservice.clearToken(verifyEmail.tokenId);
  }
  else{
    req.flash("errors"," token not updated");
    return res.redirect("/verify-email");
  }


    return res.redirect("/profile");
    }




    // change password 


    getChangePassword = (req,res)=>{

        if(!req.user) return res.redirect("/auth/login");
       return res.render("auth/change-password",{errors: req.flash("errors")});
    }

      postChangePassword = async(req,res)=>{
      if(!req.user) return res.redirect("/auth/login");
        const result = changePasswordSchema.safeParse(req.body);
       
        if(!result.success)
        {
            console.log(result.error);

            const errorMessages = result.error.issues.map(err => err.message);
            req.flash("errors",errorMessages)
            return res.redirect('/change-password');
        }

        console.log(result.data);

        const {newPassword,currentPassword} = result.data;

        



            // Get the password from db

     const user = await this.authservice.getUserById(req.user.id);


     //verify the password

     const verifypassword = await verifyPassword(user.password,currentPassword);
     console.log(verifypassword)

     if(!verifypassword)
     {
        req.flash("errors","Enter correct current Password");
        return res.redirect("/change-password");
     }


     // hash the new password

     const newHashedPassword = await hashPassword(newPassword);
     
     // update the new password in db

     try{
     await this.authservice.updatePassword({userId: req.user.id, password:newHashedPassword});
     }
     catch(err)
     {
        console.error("error during update password",err);
     }

     // clear the cache for relogin, logout user
 await this.authservice.DeleteSessionById(req.user.sessionId);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
  return res.redirect("/auth/login")
        
    }





    /// forgot password fuctionality

    getForgotPassword = (req,res)=>{
      return res.render("auth/forgot-password",{errors: req.flash("errors")});
    }


    postForgotPassword = async(req,res)=>{
        
        const result = emailVerificationSchema.safeParse(req.body);
        if(!result.success)
        {
            const errorMessages = result.error.issues.map(err=>err.message);
            req.flash("errors",errorMessages)
            return res.redirect("/forgot-password");
        }
        console.log(result.data);
        const {email} = result.data;

        const user = await this.authservice.getByEmail(email);
        

        if(user)
        {
            if(!user.password)
        {
            req.flash("errors","the user with particular email is loginned with github or google , please go in profile to set password");
            return res.redirect("/auth/login");
        }

             const token  = crypto.randomUUID();


            const hashedToken = generateTokenHash(token);

             const insertToken = await this.authservice.insertForgotToken({
                hashedToken: hashedToken,
                userId: user.id
            });


        const resetlink = this.authservice.resetLink(token);
        console.log(resetlink);


        /// getting mjml file makeing it dynamic and change to html 

        const forgotPasswordPath = path.join(import.meta.dirname,"..","email","forgot-password.mjml");
        console.log(forgotPasswordPath);

        const readfile = await fs.readFile(forgotPasswordPath,"utf-8");


        const passParameter = ejs.render(readfile,{
            link: resetlink
        });

        const mjmlToHTML = (await mjml2html(passParameter)).html;

        sendMail({
            to : email,
            subject : "Reset Your Password",
            html : mjmlToHTML
        })
    }
    else{
     req.flash("errors","user with email is not registered");
     return res.redirect("/auth/login");
    }

          return res.render("auth/forgot-password-confirmation");
         }

       
 
         getResetPage=async(req,res)=>{
            const token = req.params.token;

        // const hashtoken = await hashPassword(token); scrypt , argon2 , bcrypt uses salt that's why its hashvalue doesnot same for the same string hashing 
        
        const hashtoken = generateTokenHash(token);
        
        console.log(hashtoken);

            const user = await this.authservice.getUserByForgotToken(hashtoken);

           console.log(user);

            if(!user)
            {
                req.flash("errors","invalid or expired token used");
                return res.redirect("/forgot-password");
            }

                 res.cookie("ftoken",token,{
                maxAge: 15 * 60 * 1000,
                httpOnly: true,
                sameSite: "strict"
            })

          return res.render("auth/reset-password", {errors: req.flash("errors")});
            
         }


         postRestData= async(req,res)=>
         {
            const result = resetPasswordSchema.safeParse(req.body);
               if(!result.success)
               {
                
                 const errorMessages = result.error.issues.map(err=>err.message);
            req.flash("errors",errorMessages);
            return res.redirect("/reset-password");
               }

               const {newPassword} = result.data;

               const token = req.cookies.ftoken;

               const hashtoken  =  generateTokenHash(token);

          const user = await this.authservice.getUserByForgotToken(hashtoken);

           

            if(!user)
            {
                req.flash("errors","invalid or expired token used");
                return res.redirect("/forgot-password");
            }

            const hashpassword  = await hashPassword(newPassword);

            const updatePassword = await this.authservice.updatePassword({
                userId : user.userId,
                password: hashpassword
            });
               
            res.clearCookie("ftoken");

   await this.authservice.deleteForgotTokenById(user.tokenId);
      req.flash("success", "password reseted Successfully")
            return res.redirect("/auth/login");

         }



         getSetPasswordPage=(req,res)=>{
            if(!req.user)  return res.redirect("/");

            return res.render("auth/set-password",{errors: req.flash("errors")});
         }


         postSetPassword=async(req,res)=>{
             if(!req.user)  return res.redirect("/");

              const result = resetPasswordSchema.safeParse(req.body);
               if(!result.success)
               {
                
                 const errorMessages = result.error.issues.map(err=>err.message);
            req.flash("errors",errorMessages);
            return res.redirect("/set-password");
               }

               const {newPassword} = result.data;

               const hashedPassword = await hashPassword(newPassword);

               const user = await this.authservice.getUserById(req.user.id);

               if(user.password)
               {
                req.flash("errors","you had already password, if you forgot then try forgot password or change password");
                return res.redirect("/set-password");
               }

               const setPasswordUpdate= await this.authservice.updatePassword({
                userId: req.user.id,
                password: hashedPassword
            });

            return res.redirect("/profile");
         }



         getEditProfilePage=async(req,res)=>{
            if(!req.user) return res.redirect("/auth/login");
        
            const userId = req.params.userId;
            if(userId != req.user.id)
            {
                return res.redirect("/profile");
            }
            

            const user = await this.authservice.getUserById(req.user.id);

            return res.render("auth/edit-profile",{user: user, errors: req.flash("errors")});
         }

         postEditProfile= async(req,res)=>{
        
             if(!req.user) return res.redirect("/auth/login");
                let result = editProfileSchema.safeParse(req.body);
            console.log("post complete");
            if(!result.success)
            {
                const errorMessages = result.error.issues.map(err=>err.message);
                req.flash("errors",errorMessages);
                return res.redirect(`/edit-profile/${req.user.id}`);
            }

            const {username } = result.data;

            const fileUrl = req.file ? `uploads/avatar/${req.file.filename}` : undefined;

            const updateUser = await this.authservice.updateUser({userId:req.user.id,username,avatar:fileUrl});
            return res.redirect("/profile");
         }
};