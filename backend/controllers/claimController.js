
import Claim from "../models/Claim.js";
import Item from "../models/Item.js";
import mongoose from "mongoose";

// @desc    Create a claim for an item
// @route   POST /api/claims/:itemId
// @access  Private
export const createClaim = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { message } = req.body;

        // Validate item ID
        if (!mongoose.isValidObjectId(itemId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID."
            });
        }

        // Check whether the item exists
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        // Only available items can be claimed
        if (item.status !== "available") {
            return res.status(400).json({
                success: false,
                message: "This item is no longer available for claims."
            });
        }

        // Prevent users from claiming their own reported items
        if (
            item.reportedBy &&
            item.reportedBy.toString() === req.user.id
        ) {
            return res.status(400).json({
                success: false,
                message: "You cannot claim an item you reported."
            });
        }

        // Prevent duplicate claims
        const existingClaim = await Claim.findOne({
            item: itemId,
            claimedBy: req.user.id
        });

        if (existingClaim) {
            return res.status(409).json({
                success: false,
                message: "You have already claimed this item."
            });
        }

        // Create the claim
        const claim = await Claim.create({
            item: itemId,
            claimedBy: req.user.id,
            message: message || ""
        });

        return res.status(201).json({
            success: true,
            message: "Claim submitted successfully.",
            claim
        });

    } catch (error) {
        console.error("Create claim error:", error);

        // Handle duplicate-key errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted a claim for this item."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to submit claim."
        });
    }
};

// @desc    Get claims submitted by the logged-in user
// @route   GET /api/claims/my-claims
// @access  Private
export const getMyClaims = async (req, res) => {
    try {
        const claims = await Claim.find({
            claimedBy: req.user.id
        })
            .populate("item", "title category location date type")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: claims.length,
            claims
        });

    } catch (error) {
        console.error("Get my claims error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch your claims."
        });
    }
};

// @desc    Get claims for items reported by the logged-in user
// @route   GET /api/claims/received
// @access  Private
export const getReceivedClaims = async (req, res) => {
    try {
        const items = await Item.find({
            reportedBy: req.user.id
        }).select("_id");

        const claims = await Claim.find({
            item: { $in: items.map((item) => item._id) }
        })
            .populate("item", "title category location date type")
            .populate("claimedBy", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: claims.length,
            claims
        });
    } catch (error) {
        console.error("Get received claims error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch received claims."
        });
    }
};

// @desc    Approve or reject a claim for an item reported by the logged-in user
// @route   PATCH /api/claims/:claimId/status
// @access  Private
export const updateClaimStatus = async (req, res) => {
    try {
        const { claimId } = req.params;
        const status = req.body?.status;

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

        const claim = await Claim.findById(claimId)
            .populate("item", "reportedBy status");

        if (!claim || !claim.item) {
            return res.status(404).json({
                success: false,
                message: "Claim not found."
            });
        }

        // Only the reporter can update the claim.
        if (claim.item.reportedBy?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update claims for items you reported."
            });
        }

        // Only pending claims can be approved or rejected.
        if (claim.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This claim has already been processed."
            });
        }

        if (status === "approved") {
            // Atomically reserve the item for this claim.
            const itemUpdate = await Item.findOneAndUpdate(
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

            if (!itemUpdate) {
                return res.status(409).json({
                    success: false,
                    message: "This item is no longer available for approval."
                });
            }

            // Approve this claim only after the item is reserved.
            const claimUpdate = await Claim.findOneAndUpdate(
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

            if (!claimUpdate) {
                // Compensating update if the claim changed meanwhile.
                await Item.findOneAndUpdate(
                    {
                        _id: claim.item._id,
                        status: "claimed"
                    },
                    {
                        $set: { status: "available" }
                    }
                );

                return res.status(409).json({
                    success: false,
                    message: "The claim was already processed."
                });
            }
        } else {
            // Rejection does not change the item's status.
            const claimUpdate = await Claim.findOneAndUpdate(
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

            if (!claimUpdate) {
                return res.status(409).json({
                    success: false,
                    message: "The claim was already processed."
                });
            }
        }

        const updatedClaim = await Claim.findById(claimId)
            .populate("item", "title category location date type status")
            .populate("claimedBy", "name");

        return res.status(200).json({
            success: true,
            message: `Claim ${status} successfully.`,
            claim: updatedClaim
        });
    } catch (error) {
        console.error("Update claim status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update claim status."
        });
    }
};

// @desc    Mark an approved claim as returned
// @route   PATCH /api/claims/:claimId/returned
// @access  Private
export const markClaimReturned = async (req, res) => {
    try {
        const { claimId } = req.params;

        if (!mongoose.isValidObjectId(claimId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid claim ID."
            });
        }

        const claim = await Claim.findById(claimId)
            .populate("item", "reportedBy status");

        if (!claim || !claim.item) {
            return res.status(404).json({
                success: false,
                message: "Claim or associated item not found."
            });
        }

        if (claim.item.reportedBy?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to mark this item as returned."
            });
        }

        if (claim.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Only approved claims can be marked as returned."
            });
        }

        if (claim.returned || claim.item.status === "returned") {
            return res.status(400).json({
                success: false,
                message: "This claim has already been marked as returned."
            });
        }

        // Only update an item that is currently claimed.
        const updatedItem = await Item.findOneAndUpdate(
            {
                _id: claim.item._id,
                status: "claimed"
            },
            {
                $set: { status: "returned" }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedItem) {
            return res.status(409).json({
                success: false,
                message: "The item is not currently in the claimed state."
            });
        }

        // Only mark the approved, not-yet-returned claim as returned.
        const updatedClaim = await Claim.findOneAndUpdate(
            {
                _id: claimId,
                status: "approved",
                returned: false
            },
            {
                $set: {
                    returned: true,
                    returnedAt: new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedClaim) {
            // Compensating update if the claim could not be marked returned.
            await Item.findOneAndUpdate(
                {
                    _id: updatedItem._id,
                    status: "returned"
                },
                {
                    $set: { status: "claimed" }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            return res.status(409).json({
                success: false,
                message: "The claim has already been updated or is no longer eligible."
            });
        }

        const populatedClaim = await Claim.findById(updatedClaim._id)
            .populate("item")
            .populate("claimedBy", "name email");

        return res.status(200).json({
            success: true,
            message: "Item marked as returned successfully.",
            claim: populatedClaim
        });

    } catch (error) {
        console.error("Mark claim returned error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while marking item as returned."
        });
    }
};
