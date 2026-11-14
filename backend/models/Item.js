
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        category: {
            type: String,
            required: true,
            enum: [
                "electronics",
                "accessories",
                "documents",
                "books",
                "clothing",
                "other"
            ]
        },

        type: {
            type: String,
            required: true,
            enum: ["lost", "found"]
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        date: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "available",
                "claimed",
                "returned",
                "closed"
            ],
            default: "available"
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        imageUrl: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Item = mongoose.model("Item", itemSchema);

export default Item;
