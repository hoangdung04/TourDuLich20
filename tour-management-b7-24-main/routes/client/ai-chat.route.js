// ===================================================
// AI Chat Route – Endpoint chatbot AI tư vấn tour
// ===================================================
import { Router } from "express";
import { chat } from "../../controllers/client/ai-chat.controller.js";

const router = Router();

// POST /api/ai-chat — Gửi câu hỏi cho AI chatbot
router.post("/", chat);

export const aiChatRoutes = router;
