import { Router } from "express";
import { ShortnerController } from "../controllers/shortner.controller.js";
// import  from "../controllers/shortner.controller.js";



const controller = new ShortnerController();


const router = Router();

router.get("/", controller.getShortenerPage);

router.post("/", controller.postURLShortener);

router.get("/:shortCode", controller.redirectToShortLink);


router.route("/edit/:id").get(controller.getEditPage);

router.post("/edit",controller.postEditData);


router.route("/delete/:id").get(controller.getDeletePage);

router.post("/delete",controller.postDeleteData);

//default export
// export default router;

// Named exports
export const shortenerRoutes = router;
