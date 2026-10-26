import crypto from "crypto";
// import { findByShortCode, loadLinks, getShortCodeById, saveLinks } from "../models/shortener.model.js";
import { shortnerService } from "../service/shortner.service.js";



export class ShortnerController
{
  constructor()
  {
    this.shortnerService = new shortnerService();
  }

 getShortenerPage = async (req, res) => {
  try {
    // const file = await readFile(path.join("views", "index.html"));
    const user = req.user;
    if(!user){
      return res.redirect("/auth/login")
    }
    const links = await this.shortnerService.getAllUrls(user.id);
    return res.render("index", { links, host: req.host, errors: req.flash("errors")});
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error",error);
  }
};

 postURLShortener = async (req, res) => {
  try {
    const { url, shortCode } = req.body;
    const user = req.user;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    // const links = await loadLinks();

    // if (links[finalShortCode]) {
    //   return res
    //     .status(400)
    //     .send("Short code already exists. Please choose another.");
    // }

    // links[finalShortCode] = url;
    const links = {
      userId: user.id,
      shortCode : finalShortCode,
      url
    }
    const checkShortcode = await this.shortnerService.findByShortCode(shortCode,req.user.id);
    if(checkShortcode.success)
    {
     req.flash("errors","Shortcode already exists");
     return res.redirect("/");
    }
   

    const  data = await this.shortnerService.createUrl(links);
    // if(data.success){return res.redirect("/");}
    // else { 
    //   // res.send(data.message)
 
    // }
    if(!data.success) {
      req.flash("errors",data.message);
    }
        return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

 redirectToShortLink = async (req, res) => {
  try {
    const { shortCode } = req.params;
    if(!req.user)
    {
      res.redirect("/auth/login");
    }
    const links = await this.shortnerService.findByShortCode(shortCode,req.user.id);
    if(links.success)
    {
    return res.redirect(links.data.url);
    }
    else
    {
      req.flash("errors",links.message);
      return res.redirect("/");
    }

    // if (!links[shortCode]) return res.status(404).send("404 error occurred");


  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
};

 getEditPage = async (req,res)=>{
const id = req.params.id;
if(!req.user)
{
 req.flash("errors",
  "you must login for the edit functionality",
 )

  return res.redirect("/auth/login");
}

const result=await this.shortnerService.getShortCodeById(id, req.user.id);
if(result.success)
{
  // console.log(result.data[0]);
  // req.flash("data",result.data[0]);
res.render("edit", {data  : result.data[0], errors: req.flash("errors")});
}
else{
  req.flash("errors", result.message);
return res.redirect("/");
}  
}

 postEditData = async(req,res)=>{

  if(!req.user)
  {
    return res.redirect("/auth/login");
  }

  const {id,shortCode, url} = req.body;

      const links = await this.shortnerService.findByShortCode(shortCode,req.user.id);


      if(links.success)
      {
        req.flash("errors", "Shortcode already exists");
        return res.redirect(`/edit/${id}`);
      }

      const updatedresult = await this.shortnerService.updateShortCodeById(id, req.user.id, shortCode, url);
        if(!updatedresult.success)
        {
            req.flash("errors", updatedresult.message);
        return res.redirect(`/edit/${id}`);
        }
        else{
           req.flash("errors", updatedresult.message);
         return res.redirect('/');
        }
}







getDeletePage = async (req,res)=>{
const id = req.params.id;
if(!req.user)
{
 req.flash("errors",
  "you must login for the delete functionality",
 )

  return res.redirect("/auth/login");
}

const result=await this.shortnerService.getShortCodeById(id, req.user.id);
if(result.success)
{

res.render("delete", {data  : result.data[0], errors: req.flash("errors")});
}
else{
  req.flash("errors", result.message);
return res.redirect("/");
}  
}

 postDeleteData = async(req,res)=>{

  if(!req.user)
  {
    return res.redirect("/auth/login");
  }

  // const {id,shortCode, url} = req.body;

      // const links = await this.shortnerService.findByShortCode(shortCode,req.user.id);


      // if(links.success)
      // {
      //   req.flash("errors", "Shortcode already exists");
      //   return res.redirect(`/edit/${id}`);
      // }

      const Deletedresult = await this.shortnerService.DeleteShortCodeById(req.body.id, req.user.id);
        if(!Deletedresult.success)
        {
            req.flash("errors", Deletedresult.message);
        return res.redirect(`/delete/${req.body.id}`);
        }
        else{
           req.flash("errors", Deletedresult.message);
         return res.redirect('/');
        }
}
}

