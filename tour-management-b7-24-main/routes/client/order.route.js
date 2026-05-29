import {
    Router
} from "express";
import * as controller from "../../controllers/client/order.controller.js";
import {
    requireClientAuth
} from "../../middlewares/client/auth.middleware.js";

const router = Router();
router.post("/", controller.index);
router.post("/payos-webhook", controller.payosWebhook);
router.post("/:id/payment-link", requireClientAuth, controller.createPaymentLink);
router.post("/:id/simulate-payment", controller.simulatePayment);
router.get("/success", controller.success);
router.get("/history", requireClientAuth, controller.history);
router.patch("/:id/cancel", requireClientAuth, controller.cancelOrder);

export const orderRoutes = router;