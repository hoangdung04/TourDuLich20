import {
    Router
} from "express";
import {
    categoryRoutes
} from "./category.route.js";
import {
    tourRoutes
} from "./tour.route.js";
import {
    cartRoutes
} from "./cart.route.js";
import {
    orderRoutes
} from "./order.route.js";
import {
    clientAuthRoutes
} from "./auth.route.js";
import {
    chatRoutes
} from "./chat.route.js";
import {
    articleRoutes
} from "./article.route.js";
import {
    aiChatRoutes
} from "./ai-chat.route.js";

const router = Router();

router.use("/categories", categoryRoutes);
router.use("/tours", tourRoutes);
router.use("/cart", cartRoutes);
router.use("/order", orderRoutes);
router.use("/auth", clientAuthRoutes); // /api/client/auth/...
router.use("/chat", chatRoutes);
router.use("/articles", articleRoutes);
router.use("/ai-chat", aiChatRoutes); // Chatbot AI tư vấn tour

export const clientRoutes = router;