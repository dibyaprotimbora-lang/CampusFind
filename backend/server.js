
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";

import { rateLimit } from "express-rate-limit";

import connectDB from "./config/db.js";

import itemRoutes from "./routes/itemRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

// Disable Express technology disclosure.
app.disable("x-powered-by");

// Trust one reverse proxy only when explicitly configured.
// This is useful for supported hosting platforms.
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Security headers.
app.use(helmet());

// CORS configuration.
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (
  process.env.NODE_ENV === "production" &&
  allowedOrigins.length === 0
) {
  throw new Error("CORS_ORIGINS must be configured in production.");
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header, such as server-to-server
    // requests and command-line health checks.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Request body limits.
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// General API rate limit.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

// Apply rate limits to API routes.
app.use("/api", apiLimiter);

// Login and registration have separate rate limits in authRoutes.
app.use("/api/auth", authRoutes);

// Serve uploaded images (temporary until cloud storage is configured).
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Other API routes.
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);

// Health check.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CampusFind API is running!"
  });
});

// Central error handler.
app.use((err, req, res, next) => {
  console.error("Request error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "This origin is not allowed."
    });
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});

// Server configuration.
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CampusFind API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
