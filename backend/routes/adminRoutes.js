
import express from "express";
import { body, param, checkExact } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";

import protect from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
    getAdminOverview,
    getAdminUsers,
    getAdminItems,
    getAdminClaims,
    adminUpdateClaimStatus
} from "../controllers/adminController.js";


// Validate administrator claim approval/rejection requests.
const adminClaimStatusValidation = [
    param("claimId")
        .isMongoId()
        .withMessage("Invalid claim ID."),
    body("status")
        .isString()
        .withMessage("Status must be text.")
        .bail()
        .isIn(["approved", "rejected"])
        .withMessage("Status must be approved or rejected.")
];
const router = express.Router();

// All admin routes require authentication and admin authorization
router.use(protect, adminMiddleware);

router.get("/overview", getAdminOverview);
router.get("/users", getAdminUsers);
router.get("/items", getAdminItems);
router.get("/claims", getAdminClaims);
router.patch(
    "/claims/:claimId/status",
    adminClaimStatusValidation,
    checkExact(adminClaimStatusValidation, { locations: ["body"] }),
    validateRequest,
    adminUpdateClaimStatus
);

export default router;
