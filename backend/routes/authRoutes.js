
import express from "express";
import { rateLimit } from "express-rate-limit";

import {
  registerUser,
  loginUser
} from "../controllers/authController.js";

const router = express.Router();

// Login: maximum 5 attempts per IP every 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes."
  }
});

// Registration: maximum 5 attempts per IP every hour.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later."
  }
});

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);

export default router;
