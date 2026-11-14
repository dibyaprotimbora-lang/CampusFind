
import User from "../models/User.js";

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select("role");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found."
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        next();

    } catch (error) {
        console.error("Admin authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify admin permissions."
        });
    }
};

export default adminMiddleware;
