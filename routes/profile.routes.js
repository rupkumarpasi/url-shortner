
import express from "express";
import {ProfileController} from "../controllers/profile.controller.js"
import { avatarUpload } from "../configuration/fileUpload.js";

const router = express.Router();
const controller = new ProfileController();


export function profileRoutes()
{
    router.get("/profile", controller.getProfilePage);

    router.get("/verify-email",controller.getVerifyEmailPage);

      router.get("/resend-verification-code",controller.resendVerificationCode);

    router.get("/verify-email-token",controller.postVerifiedCode);

    router.get("/change-password",controller.getChangePassword);
    router.post("/change-password",controller.postChangePassword);




    /// forgot password
router.route("/forgot-password")
.get(controller.getForgotPassword)
.post(controller.postForgotPassword);

router.get("/reset-password/:token",controller.getResetPage);

router.post("/reset-password",controller.postRestData);


router.get("/set-password",controller.getSetPasswordPage);
router.post("/set-password",controller.postSetPassword);


router.get("/edit-profile/:userId",controller.getEditProfilePage);
router.post("/edit-profile",avatarUpload.single("avatar"),controller.postEditProfile);


    return router;
}