import { Router } from "express";
import * as controller from "../../controllers/client/order.controller.js";

const router = Router();
router.post("/", controller.index);
router.get("/success", controller.success);

export const orderRoutes = router;
