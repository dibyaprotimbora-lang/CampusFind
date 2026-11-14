import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        claimedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        message: {
            type: String,
            trim: true,
            maxlength: 500
        },

        returned: {
            type: Boolean,
            default: false
        },

        returnedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same user from claiming the same item more than once.
claimSchema.index(
    { item: 1, claimedBy: 1 },
    { unique: true }
);

const Claim = mongoose.model("Claim", claimSchema);

export default Claim;