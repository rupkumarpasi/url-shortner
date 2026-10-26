import express from "express";
import { shortenerRoutes } from "./routes/shortener.routes.js";
import {authRoutes} from "./routes/auth.routes.js";
import cookieParser from 'cookie-parser';
import { verifyJwtToken } from "./middlewares/jwt-verification.js";
import flash from "connect-flash";
import session from "express-session";
import requestIp from "request-ip";
import { profileRoutes } from "./routes/profile.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestIp.mw());

app.use(verifyJwtToken);
app.use((req,res,next)=>{
  res.locals.user = req.user;
  return next();
})

app.use(session({secret:"my-secret", saveUninitialized: false, resave: true}));
app.use(flash());

app.set("view engine", "ejs");
// app.set("views", "./views")

//? In Express.js, a template engine is a tool that lets you embed dynamic content into HTML files and render them on the server before sending them to the client. It allows you to create reusable templates, making it easier to generate dynamic web pages with minimal code.

// express router
// app.use(router);

app.use(profileRoutes());
app.use("/auth",authRoutes());
app.use(shortenerRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
