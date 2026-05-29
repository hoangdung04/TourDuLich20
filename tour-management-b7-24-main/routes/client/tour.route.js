import { Router } from "express";
import * as controller from "../../controllers/client/tour.controller.js";

const router = Router();
router.get("/featured", controller.featured);          // GET /api/tours/featured
router.get("/search", controller.search);              // GET /api/tours/search?keyword=...
router.get("/by-categories", controller.byCategories); // GET /api/tours/by-categories
router.get("/detail/:slugTour", controller.detail);
router.get("/:slugCategory", controller.list);

export const tourRoutes = router;
