
import express from "express";
import { authController } from "../controllers/auth.controller.js";

const controller = new authController();

const routes = express.Router();

export  function authRoutes(){

     routes.get("/register", controller.register);
     routes.post("/register",controller.postRegister);

     routes.get("/login",controller.login);
     routes.post("/login",controller.postLogin);

     routes.route("/me").get(controller.me);
routes.get("/logout",controller.logout);

routes.get("/google",controller.getGoogleLoginPage);

routes.get("/callback",controller.callBack)


routes.get("/github",controller.getGithubLoginPage);

routes.get("/github/callback",controller.GithubcallBack)

     return routes;
}