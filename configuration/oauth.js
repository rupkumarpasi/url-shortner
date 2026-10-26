// OAuth configuration
import crypto from "node:crypto";

 export const codeVerifier = crypto.randomBytes(32).toString("base64url");

 export const challenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

export const googleOauth = {
  authorizationURL: process.env.OAUTH_AUTHORIZATION_GOOGLE_URL,
  tokenURL: process.env.GOOGLE_TOKEN_URL,
  userInfoURL: process.env.GOOGLE_USERINFO_URL,
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  scope: 'openid profile email',
  challenge: challenge,
  codeVerifier: codeVerifier
};


export const GithubOauth = {
  authorizationURL: process.env.OAUTH_AUTHORIZATION_GITHUB_URL,
  tokenURL: process.env.GITHUB_TOKEN_URL,
  userInfoURL: process.env.GITHUB_USERINFO_URL,
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  redirectUri: process.env.GITHUB_REDIRECT_URI,
  scope: 'user:email',
   challenge: challenge,
  codeVerifier: codeVerifier
};

