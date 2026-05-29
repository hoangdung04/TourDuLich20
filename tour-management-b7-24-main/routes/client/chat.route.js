import {
    Router
} from "express";
import * as controller from "../../controllers/client/chat.controller.js";
import {
    requireClientAuth
} from "../../middlewares/client/auth.middleware.js";


const router = Router();

router.get("/", requireClientAuth, controller.index);

export const chatRoutes = router;