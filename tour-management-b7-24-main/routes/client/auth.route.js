import { Router } from "express";
import { register, login, logout } from "../../controllers/client/auth.controller.js";

const router = Router();

router.post("/register", register); // POST /api/client/auth/register
router.post("/login", login);       // POST /api/client/auth/login
router.post("/logout", logout);     // POST /api/client/auth/logout

export const clientAuthRoutes = router;
