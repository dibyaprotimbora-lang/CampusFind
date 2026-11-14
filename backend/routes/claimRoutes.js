import express from "express";
import {
    body,
    param,
    checkExact
} from "express-validator";

import {
    createClaim,
    getMyClaims,
    getReceivedClaims,
    markClaimReturned,
    updateClaimStatus
} from "../controllers/claimController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

// Validate item ID and optional claim message.
const createClaimValidation = [
    param("itemId")
        .isMongoId()
        .withMessage("Invalid item ID."),

    body("message")
        .optional()
        .isString()
        .withMessage("Claim message must be text.")
        .bail()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Claim message cannot exceed 500 characters.")
];

// Validate approval or rejection.
const updateStatusValidation = [
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

// Validate claim ID for the return operation.
const returnedValidation = [
    param("claimId")
        .isMongoId()
        .withMessage("Invalid claim ID.")
];

// View claims submitted by the logged-in user.
router.get("/my-claims", authMiddleware, getMyClaims);

// View claims received for the user's reported items.
router.get("/received", authMiddleware, getReceivedClaims);

// Submit a claim.
router.post(
    "/:itemId",
    authMiddleware,
    checkExact(createClaimValidation, { locations: ["body"] }),
    validateRequest,
    createClaim
);

// Approve or reject a received claim.
router.patch(
    "/:claimId/status",
    authMiddleware,
    checkExact(updateStatusValidation, { locations: ["body"] }),
    validateRequest,
    updateClaimStatus
);

// Mark an approved claim as returned.
router.patch(
    "/:claimId/returned",
    authMiddleware,
    ...returnedValidation,
    checkExact([], { locations: ["body"] }),
    validateRequest,
    markClaimReturned
);

export default router;
