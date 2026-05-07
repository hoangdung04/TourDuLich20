import { Router } from "express";
import * as controller from "../../controllers/client/tour.controller.js";

const router = Router();
router.get("/detail/:slugTour", controller.detail);
router.get("/:slugCategory", controller.list);

export const tourRoutes = router;
