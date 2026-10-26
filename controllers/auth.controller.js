import {
  authenticationComplete,
  authService,
} from "../service/auth.service.js";
import querystring from "querystring";
import crypto from "node:crypto";

import { hashPassword, verifyPassword } from "../hash_password.js";
import { registrationSchema } from "../validations/auth-validation.js";
import { sendMail } from "../lib/resendMail.js";
import mjml2html from "mjml";
import path from "node:path";
import fs from "node:fs/promises";
import ejs from "ejs";

import { GithubOauth, googleOauth } from "../configuration/oauth.js";
import axios from "axios";

export class authController {
  constructor() {
    this.authService = new authService();
  }

  register = (req, res) => {
    res.render("auth/register", { errors: req.flash("errors") });
  };

  login = (req, res) => {
    res.render("auth/login", {
      errors: req.flash("errors"),
      success: req.flash("success"),
    });
  };

  postRegister = async (req, res) => {
    try {
      const result = registrationSchema.safeParse(req.body);
      if (!result.success) {
        // console.log(result.error.format());
        //       // Extract just the message strings from Zod's error array
        // const errorMessages = result.error.zodError
        const errorMessages = result.error.issues.map((err) => err.message);
        req.flash("errors", errorMessages);
        return res.redirect("/auth/register");
      }
      const { email, password, username } = result.data;

      const userExist = await this.authService.getByEmail(email);

      // Fixed check because userExist is an object/undefined, not an array
      if (userExist) {
        req.flash("errors", "Email Already Exists");
        return res.redirect("/auth/register");
        // return res.status(400).send("THE EMAIL ALREADY EXISTS -----");
      }

      const hashedPassword = await hashPassword(password);

      const userInfo = {
        username,
        email,
        password: hashedPassword,
      };

      const registereData = await this.authService.registerUser(userInfo);
      console.log(registereData.data);

      if (registereData.success) {
        const session = await this.authService.createSession({
          userId: registereData.data.id,
          ip: req.clientIp,
          userAgent: req.headers["user-agent"],
        });

        const payload = {
          id: registereData.data.id,
          username: registereData.data.username,
          email: registereData.data.email,
          sessionId: session.id,
        };

        const accessToken = this.authService.createAccessToken(payload);

        const refreshToken = this.authService.createRefreshToken(session.id);

        res.cookie("access_token", accessToken, {
          maxAge: 15 * 60 * 1000,
          httpOnly: true,
          secure: true,
          sameSite: "lax", // Use 'lax' or 'strict' depending on your frontend/backend setup
          encode: (val) => val, // Prevents any automatic encoding interference
        });

        res.cookie("refresh_token", refreshToken, {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          httpOnly: true, // cookie is not accessed by javascript
          secure: true,
          sameSite: "lax", // Recommended security flag only send information only on secured s version
        });

        const randomToken = this.authService.generateToken();

        const insertToken = await this.authService.insertEmailToken({
          userId: registereData.data.id,
          token: randomToken,
        });

        const verifyTokenLink = this.authService.verifyEmailTokenLink({
          email: registereData.data.email,
          token: randomToken,
        });

        const emailPath = path.join(
          import.meta.dirname,
          "..",
          "email",
          "email.mjml",
        );

        const readMjmlFile = await fs.readFile(emailPath, "utf-8");

        const passPlaceholder = ejs.render(readMjmlFile, {
          token: randomToken,
          link: verifyTokenLink,
        });

        const mjmlToHTML = (await mjml2html(passPlaceholder)).html;

        sendMail({
          to: registereData.data.email,
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
          html: mjmlToHTML,
        });

        return res.redirect("/");
      } else {
        return res.status(500).send("THE EMAIL ALREADY EXISTS");
      }
    } catch (error) {
      console.error(error);

      req.flash("errors", "Internal Server Error");

      return res.status(500);
    }
  };

  postLogin = async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await this.authService.getByEmail(email);
      // console.log(user)
      if (!user) {
        req.flash("errors", "Incorrect Email or Password");
        return res.redirect("/auth/login");
      }

      if (!user.password) {
        req.flash(
          "errors",
          "you may login before with google or github ,please do the same way or please signup?",
        );
        return res.redirect("/auth/login");
      }
      //   const passwordCheck = await this.authService.getByPassword(password);

      const verifiedPassword = await verifyPassword(user.password, password);
      if (!verifiedPassword) {
        req.flash("errors", "Incorrect Email or Password");
        return res.redirect("/auth/login");
      }

      // const token = this.authService.jwtTokenGenerate(payload);

      // console.log(token);

      //       res.cookie('isLoggedIn', true, {
      //     maxAge: 1 * 60 * 1000, // 1 hour
      //     httpOnly: true          // Recommended security flag
      // });

      const session = await this.authService.createSession({
        userId: user.id,
        ip: req.clientIp,
        userAgent: req.headers["user-agent"],
      });

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        sessionId: session.id,
      };

      const accessToken = this.authService.createAccessToken(payload);

      const refreshToken = this.authService.createRefreshToken(session.id);

      res.cookie("access_token", accessToken, {
        maxAge: 15 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: "lax", // Use 'lax' or 'strict' depending on your frontend/backend setup
        encode: (val) => val, // Prevents any automatic encoding interference
      });

      res.cookie("refresh_token", refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true, // cookie is not accessed by javascript
        secure: true,
        sameSite: "lax", // Recommended security flag only send information only on secured s version
      });

      return res.redirect("/");
    } catch (error) {
      throw error;
    }
  };

  //concept of protected route when a route depend on verified user so that only verified user can access it

  me = (req, res) => {
    if (!req.user) return res.send("you are not logged in");
    const { username, email } = req.user;

    return res.send(`hey my name is ${username} and my email is ${email}`);
  };

  logout = async (req, res) => {
    await this.authService.DeleteSessionById(req.user.sessionId);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("tokens");
    res.redirect("/");
  };

  /// login with google functionality

  getGoogleLoginPage = (req, res) => {
    if (req.user) return res.redirect("/");

    const cookieConfig = {
      httpOnly: true,
      secure: true, // Set to false if you are testing locally on plain http://
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    };

    // res.cookie("google_oauth_codeverifier", codeVerifier, cookieConfig);
    const state = crypto.randomBytes(32).toString("hex");
    //   const codeVerifier = crypto.randomBytes(32).toString("base64url");
    res.cookie("code_verifier", googleOauth.codeVerifier);

    // const challenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    console.log(state);
    res.cookie("google_oauth_state", state, cookieConfig);

    // req.session.oauthState = state;

    const authUrl = `${googleOauth.authorizationURL}?${querystring.stringify({
      response_type: "code",
      client_id: googleOauth.clientId,
      redirect_uri: googleOauth.redirectUri,
      scope: googleOauth.scope,
      state,
      code_challenge: googleOauth.challenge,
      code_challenge_method: "S256",
    })}`;
    res.redirect(authUrl);
  };

  callBack = async (req, res) => {
    const { code, state, error, error_description } = req.query;

    // Handle authorization errors
    if (error) {
      console.error("Authorization error:", error, error_description);
      return res.redirect(`/login?error=${error}`);
    }

    // Validate state (CSRF protection)
    if (!state || state !== req.cookies.google_oauth_state) {
      console.error("Invalid state parameter");
      return res.status(403).send("Invalid state - possible CSRF attack");
    }

    // // Prevent double-use
    // if (req.session.tokens) {
    //   return res.redirect('/profile');
    // }

    console.log(req.cookies.code_verifier);
    try {
      // Exchange authorization code for tokens
      const tokenResponse = await axios.post(
        googleOauth.tokenURL,
        querystring.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: googleOauth.redirectUri,
          client_id: googleOauth.clientId,
          client_secret: googleOauth.clientSecret,
          code_verifier: req.cookies.code_verifier,
        }),
        // {
        //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //   timeout: 5000
        // }
      );

      // Store tokens in session
      // res.cookie("tokens",tokenResponse.data); optional need for future request if you try to get it in same request it returns undefined

      // req.session.tokens = tokenResponse.data;
      // req.session.tokenIssuedAt = Date.now();
      res.clearCookie("google_oauth_state");
      console.log(tokenResponse.data);

      const userInformation = await axios.get(googleOauth.userInfoURL, {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      });

      // res.clearCookie("tokens");
      const userInfo = userInformation.data;
      console.log(userInfo);

      //scenario 1: check whether user already link with google

      const oauthCheck = await this.authService.findOAuthByGoogleId({
        provider: "google",
        providerAccountId: userInfo.sub,
      });

      if (oauthCheck) {
        return await authenticationComplete({
          userId: oauthCheck.userId,
          username: userInfo.given_name,
          email: userInfo.email,
          req,
          res,
        });
      }

      //section 2 : if user doesnot exist in the db : verify email and insert
      const user = await this.authService.getByEmail(userInfo.email);
      if (!user) {
        console.log(
          "userINfo with email verified or not",
          userInfo.email_verified,
        );
        if (userInfo.email_verified) {
          console.log("users enter into register data");
          const insertedUserWithGoogleOAuth =
            await this.authService.registerUserWithGoogleOauth({
              email: userInfo.email,
              username: userInfo.given_name,
              isEmailValid: true,
              providerAccountId: userInfo.sub,
              provider: "google",
            });
          console.log("user skip out of the register data");
          console.log(insertedUserWithGoogleOAuth);

          return await authenticationComplete({
            userId: insertedUserWithGoogleOAuth.userId,
            username: userInfo.name,
            email: userInfo.email,
            req,
            res,
          });
        } else {
          req.flash("errors", "please verify your email first,");
          return res.redirect("/auth/login");
        }
      }

      //if user exist
      if (user.isEmailValid) {
        const referenceUser = await this.authService.referenceUserWithOauth({
          userId: user.id,
          providerAccountId: userInfo.sub,
          provider: "google",
        });

        return await authenticationComplete({
          userId: user.id,
          username: user.username,
          email: user.email,
          req,
          res,
        });
      } else {
        req.flash("errors", "please verify your email first,");
        return res.redirect("/auth/login");
      }

      console.log("User authenticated successfully");
    } catch (err) {
      console.error(
        "Token exchange failed:",
        err.response?.data || err.message,
      );
      res.redirect("/login?error=authentication_failed");
    }
  };

  // login with Github oAuth

  getGithubLoginPage = (req, res) => {
    if (req.user) {
      req.flash("errors", "logout first you are already logged in");
      return res.redirect("/");
    }
    const state = crypto.randomBytes(32).toString("hex");

    const cookieConfig = {
      httpOnly: true,
      secure: true, // Set to false if you are testing locally on plain http://
      sameSite: "strict",
      maxAge: 10 * 60 * 1000,
    };

    console.log(GithubOauth.codeVerifier);
    res.cookie("github_state", state, cookieConfig);
    res.cookie("github_code_verifier", GithubOauth.codeVerifier, cookieConfig);

    //     const authUrl = `${githu.authorizationURL}?${querystring.stringify({
    //   response_type: "code",
    //   client_id: googleOauth.clientId,
    //   redirect_uri: googleOauth.redirectUri,
    //   scope: googleOauth.scope,
    //   state,
    //   code_challenge: googleOauth.challenge,
    //   code_challenge_method: "S256",
    // })}`;

    const authUrl = new URL(GithubOauth.authorizationURL);
    authUrl.search = new URLSearchParams({
      response_type: "code",
      client_id: GithubOauth.clientId,
      redirect_uri: GithubOauth.redirectUri,
      scope: GithubOauth.scope,
      state,
      code_challenge: GithubOauth.challenge,
      code_challenge_method: "S256",
    });

    res.redirect(authUrl.toString());
  };

  GithubcallBack = async (req, res) => {
    if (req.user) {
      req.flash("errors", "logout first you are already logged in");
      return res.redirect("/");
    }
    const { code, state, error, error_description } = req.query;

    // Handle authorization errors
    if (error) {
      console.error("Authorization error:", error, error_description);
      return res.redirect(`/login?error=${error}`);
    }

    if (!state && state != req.cookies.github_state) {
      return res.send("state parameter altered or doesnot configure correctly");
    }

    //  const tokenResponse = await axios.post(
    //     googleOauth.tokenURL,
    //     querystring.stringify({
    //       grant_type: "authorization_code",
    //       code,
    //       redirect_uri: googleOauth.redirectUri,
    //       client_id: googleOauth.clientId,
    //       client_secret: googleOauth.clientSecret,
    //       code_verifier: req.cookies.code_verifier,
    //     }),
    //     // {
    //     //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //     //   timeout: 5000
    //     // }
    //   );
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: GithubOauth.redirectUri,
      client_id: GithubOauth.clientId,
      client_secret: GithubOauth.clientSecret,
      code_verifier: req.cookies.github_code_verifier,
    });
    try {
      const ResponseData = await axios.post(
        GithubOauth.tokenURL,
        tokenParams.toString(),
        {
          headers: {
            // 'Content-Type': 'application/x-www-form-urlencoded'
            Accept: "application/vnd.github+json",
          },
          timeout: 5000,
        },
      );
      console.log(ResponseData.data);

      const userInformation = await axios.get(GithubOauth.userInfoURL, {
        headers: { Authorization: `Bearer ${ResponseData.data.access_token}` },
      });

      // res.clearCookie("tokens");
      const userInfo = userInformation.data;
      console.log(userInfo);

      const emailResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: {
            Authorization: `Bearer ${ResponseData.data.access_token}`,
            Accept: " application/vnd.github+json",
            "X-GitHub-Api-Version": "2026-03-10",
          },
        },
      );

      const [emailInfo] = emailResponse.data;

      console.log(emailResponse.data);

      // scenario 1: check whether user already link with google

      const oauthCheck = await this.authService.findOAuthByGoogleId({
        provider: "github",
        providerAccountId: userInfo.id,
      });

      if (oauthCheck) {
        return await authenticationComplete({
          userId: oauthCheck.userId,
          username: userInfo.name,
          email: emailInfo.email,
          req,
          res,
        });
      }

      //section 2 : if user doesnot exist in the db : verify email and insert
      const user = await this.authService.getByEmail(emailInfo.email);
      if (!user) {
        console.log(
          "userINfo with email verified or not",
          emailInfo.verified,
        );
        if (emailInfo.verified) {
          console.log("users enter into register data");
          const insertedUserWithGoogleOAuth =
            await this.authService.registerUserWithGoogleOauth({
              email: emailInfo.email,
              username: userInfo.name,
              isEmailValid: true,
              providerAccountId: userInfo.id,
              provider: "github",
            });
          console.log("user skip out of the register data");
          console.log(insertedUserWithGoogleOAuth);

          return await authenticationComplete({
            userId: insertedUserWithGoogleOAuth.userId,
            username: userInfo.name,
            email: emailInfo.email,
            req,
            res,
          });
        } else {
          req.flash("errors", "please verify your email first,");
          return res.redirect("/auth/login");
        }
      }

      // if user exist
      if (user.isEmailValid) {
        const referenceUser = await this.authService.referenceUserWithOauth({
          userId: user.id,
          providerAccountId: userInfo.id,
          provider: "github",
        });

        return await authenticationComplete({
          userId: user.id,
          username: user.username,
          email: user.email,
          req,
          res,
        });
      } else {
        req.flash("errors", "please verify your email first,");
        return res.redirect("/auth/login");
      }
    } catch (error) {
      return res.send(`unauthorize : ${error}`);
    }
  };
}
