import { Router } from "express";
import {
  register,
  verifyRegister,
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp
} from "../../controllers/client/auth.controller.js";
import { requireClientAuth } from "../../middlewares/client/auth.middleware.js";

const router = Router();

router.post("/register",        register);                                // POST /api/auth/register
router.post("/register/verify", verifyRegister);                          // POST /api/auth/register/verify
router.post("/login",           login);                                   // POST /api/auth/login
router.post("/logout",          logout);                                  // POST /api/auth/logout
router.post("/change-password", requireClientAuth, changePassword);       // POST /api/auth/change-password
router.post("/password/forgot", forgotPassword);                         // POST /api/auth/password/forgot
router.post("/password/reset",  resetPassword);                           // POST /api/auth/password/reset
router.post("/otp/resend",      resendOtp);                               // POST /api/auth/otp/resend

export const clientAuthRoutes = router;
