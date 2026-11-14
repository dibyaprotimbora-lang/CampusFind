import express from "express";
import {
  body,
  param,
  query,
  checkExact
} from "express-validator";

import {
  createItem,
  getItems,
  getItemById
} from "../controllers/itemController.js";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import processImage from "../middleware/processImage.js";
import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

const categories = [
  "electronics",
  "accessories",
  "documents",
  "books",
  "clothing",
  "other"
];

const itemTypes = ["lost", "found"];

// Validate public item-list filters.
const validateItemQuery = [
  query("type")
    .optional()
    .isIn(itemTypes)
    .withMessage("Invalid item type."),

  query("category")
    .optional()
    .isIn(categories)
    .withMessage("Invalid item category."),

  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search must be 100 characters or fewer."),

  query("page")
    .optional()
    .isInt({ min: 1, max: 1000000 })
    .toInt()
    .withMessage("Invalid page number."),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt()
    .withMessage("Limit must be between 1 and 50."),

  checkExact([
    query("type"),
    query("category"),
    query("search"),
    query("page"),
    query("limit")
  ], {
    locations: ["query"],
    message: "Unexpected query parameter."
  }),

  validateRequest
];

// Validate an individual item ID.
const validateItemId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid item ID."),

  validateRequest
];

// Validate new item details.
const validateCreateItem = [
  body("title")
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Title must contain 2–100 characters."),

  body("description")
    .isString()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage("Description must contain 5–1000 characters."),

  body("category")
    .isIn(categories)
    .withMessage("Invalid item category."),

  body("type")
    .isIn(itemTypes)
    .withMessage("Item type must be lost or found."),

  body("location")
    .isString()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Location must contain 2–150 characters."),

  body("date")
    .isISO8601()
    .withMessage("Please provide a valid date."),

  checkExact([
    body("title"),
    body("description"),
    body("category"),
    body("type"),
    body("location"),
    body("date")
  ], {
    locations: ["body"],
    message: "Unexpected item field."
  }),

  validateRequest
];

// Public routes: browse items.
router.get("/", validateItemQuery, getItems);

router.get(
  "/:id",
  validateItemId,
  getItemById
);

// Protected route: report an item.
router.post(
  "/",
  protect,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Image must be 5 MB or smaller."
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message || "Image upload failed."
        });
      }

      next();
    });
  },
  processImage,
  validateCreateItem,
  createItem
);

export default router;
