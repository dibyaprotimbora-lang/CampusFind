
import User from "../models/User.js";
import Item from "../models/Item.js";
import Claim from "../models/Claim.js";
import mongoose from "mongoose";

// GET /api/admin/overview
export const getAdminOverview = async (req, res) => {
    try {
        const [
            totalUsers,
            totalItems,
            lostItems,
            foundItems,
            totalClaims,
            pendingClaims,
            approvedClaims,
            returnedItems
        ] = await Promise.all([
            User.countDocuments(),
            Item.countDocuments(),
            Item.countDocuments({ type: "lost" }),
            Item.countDocuments({ type: "found" }),
            Claim.countDocuments(),
            Claim.countDocuments({ status: "pending" }),
            Claim.countDocuments({ status: "approved" }),
            Item.countDocuments({ status: "returned" })
        ]);

        return res.status(200).json({
            success: true,
            statistics: {
                totalUsers,
                totalItems,
                lostItems,
                foundItems,
                totalClaims,
                pendingClaims,
                approvedClaims,
                returnedItems
            }
        });
    } catch (error) {
        console.error("Admin overview error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load admin statistics."
        });
    }
};

// GET /api/admin/users
export const getAdminUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("name email role createdAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Admin users error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch users."
        });
    }
};

// GET /api/admin/items
export const getAdminItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate("reportedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: items.length,
            items
        });
    } catch (error) {
        console.error("Admin items error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch items."
        });
    }
};

// GET /api/admin/claims
export const getAdminClaims = async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate("item", "title category type location status")
            .populate("claimedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: claims.length,
            claims
        });
    } catch (error) {
        console.error("Admin claims error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch claims."
        });
    }
};

// PATCH /api/admin/claims/:claimId/status
// Admin-only route: administrators may process claims for any reported item.
export const adminUpdateClaimStatus = async (req, res) => {
    try {
        const { claimId } = req.params;
        const { status } = req.body || {};

        if (!mongoose.isValidObjectId(claimId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid claim ID."
            });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be approved or rejected."
            });
        }

        const claim = await Claim.findById(claimId).populate("item", "status");

        if (!claim || !claim.item) {
            return res.status(404).json({
                success: false,
                message: "Claim or associated item not found."
            });
        }

        if (claim.status !== "pending") {
            return res.status(409).json({
                success: false,
                message: "This claim has already been processed."
            });
        }

        if (status === "approved") {
            // Reserve the item first so two claims cannot both be approved.
            const reservedItem = await Item.findOneAndUpdate(
                {
                    _id: claim.item._id,
                    status: "available"
                },
                {
                    $set: { status: "claimed" }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!reservedItem) {
                return res.status(409).json({
                    success: false,
                    message: "This item is no longer available for approval."
                });
            }

            const updated = await Claim.findOneAndUpdate(
                {
                    _id: claimId,
                    status: "pending"
                },
                {
                    $set: { status: "approved" }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!updated) {
                // Restore availability if another request processed this claim first.
                await Item.findOneAndUpdate(
                    {
                        _id: claim.item._id,
                        status: "claimed"
                    },
                    {
                        $set: { status: "available" }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                return res.status(409).json({
                    success: false,
                    message: "The claim was already processed."
                });
            }
        } else {
            const updated = await Claim.findOneAndUpdate(
                {
                    _id: claimId,
                    status: "pending"
                },
                {
                    $set: { status: "rejected" }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!updated) {
                return res.status(409).json({
                    success: false,
                    message: "The claim was already processed."
                });
            }
        }

        const updatedClaim = await Claim.findById(claimId)
            .populate("item", "title category type location status")
            .populate("claimedBy", "name email");

        return res.status(200).json({
            success: true,
            message: `Claim ${status} successfully.`,
            claim: updatedClaim
        });
    } catch (error) {
        console.error("Admin update claim status error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update claim status."
        });
    }
};
