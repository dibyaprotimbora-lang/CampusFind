import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    // Make sure the server has a JWT secret.
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment configuration.");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured."
      });
    }

    // Read the Authorization header.
    const authorization = req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in."
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }

    // Verify token signature and expiration.
    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
        {
          algorithms: ["HS256"]
        }
      );
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again."
      });
    }

    // Ensure the token contains a valid user ID.
    if (
      !decoded ||
      typeof decoded.id !== "string" ||
      !/^[a-f\d]{24}$/i.test(decoded.id)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }

    // Check that the account still exists.
    const user = await User.findById(decoded.id).select("_id role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists. Please log in again."
      });
    }

    // Attach verified database information to the request.
    req.user = {
      id: user._id.toString(),
      role: user.role
    };

    return next();

  } catch (error) {
    console.error("Authentication middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate this request."
    });
  }
};

export default protect;
