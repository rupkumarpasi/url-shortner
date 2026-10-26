
import {string, z} from "zod";

export const emailVerificationSchema = z.object({
   email: z.string().email({message: "email is not valid "})
})

export const registrationSchema = z.object({
    username: string().trim().min(3,{message : "please enter your username"})
    .max(100,{message: "username must be less or equal to 100"}),


    email : string().trim().email({message: "please enter a valid email"}),

    password: string().min(6,"please enter password , more than 5 character long"),

});



export const postEmailVerificationSchema = z.object({
  token: z.string().trim().length(6, { message: "Token must be exactly 6 characters" }),
  email: z.string().email({message: "email is not valid "})
});


export const changePasswordSchema = z.object({

  currentPassword : string().min(6,{ message: "please enter password , more than 5 character long"}),
  newPassword: string().min(6,{message: "please enter password , more than 5 character long"}),
  confirmPassword: string().min(1,{message: "confirm your new password"}),
}).refine((data)=> data.newPassword === data.confirmPassword,
{
  message: "Passwords do not match",
    path: ["confirmPassword"]
});


export const resetPasswordSchema = z.object({
    newPassword: string().min(6,{message: "please enter password , more than 5 character long"}),
  confirmPassword: string().min(1,{message: "confirm your new password"}),
}).refine((data)=> data.newPassword === data.confirmPassword,
{
  message: "Passwords do not match",
    path: ["confirmPassword"]
});




const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const editProfileSchema = z.object({
  // Validate text fields from req.body
  username: z.string().trim()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(100, { message: "Username must be less than or equal to 100 characters" }),

  // Validate the file object from req.file (Multer stores metadata here)
  avatar: z.object({
    size: z.number().max(MAX_FILE_SIZE, { message: "Max file size is 5MB." }),
    mimetype: z.string().refine(
      (type) => ACCEPTED_IMAGE_TYPES.includes(type),
      { message: ".jpg, .jpeg, .png and .webp files are accepted." }
    ),
  }, { message: "Please upload an avatar file" })
  .optional(), // Make .optional() if uploading an avatar is not strictly required
});