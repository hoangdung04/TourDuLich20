import { Router } from "express";
import * as controller from "../../controllers/client/cart.controller.js";

const router = Router();
router.post("/list", controller.list);

export const cartRoutes = router;
