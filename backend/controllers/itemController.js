import Item from "../models/Item.js";
import fs from "node:fs/promises";

// Escape special regular-expression characters in user searches.
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Create a new item report.
export const createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      location,
      date
    } = req.body;

    // Additional server-side validation.
    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof category !== "string" ||
      typeof type !== "string" ||
      typeof location !== "string" ||
      typeof date !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid item details."
      });
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanLocation = location.trim();
    const itemDate = new Date(date);

    if (
      cleanTitle.length < 2 ||
      cleanTitle.length > 100 ||
      cleanDescription.length < 5 ||
      cleanDescription.length > 1000 ||
      cleanLocation.length < 2 ||
      cleanLocation.length > 150 ||
      Number.isNaN(itemDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more item details are invalid."
      });
    }

    const allowedCategories = [
      "electronics",
      "accessories",
      "documents",
      "books",
      "clothing",
      "other"
    ];

    if (
      !allowedCategories.includes(category) ||
      !["lost", "found"].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid item category or type."
      });
    }

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : "";

    const item = await Item.create({
      title: cleanTitle,
      description: cleanDescription,
      category,
      type,
      location: cleanLocation,
      date: itemDate,
      imageUrl,
      reportedBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: "Item reported successfully!",
      item
    });

  } catch (error) {
    // Remove the processed image if item creation fails.
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("Image cleanup failed:", cleanupError.message);
        }
      }
    }

    console.error("Create item error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please check the submitted item details."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while reporting item."
    });
  }
};

// Get all items with safe search and pagination.
export const getItems = async (req, res) => {
  try {
    const {
      type,
      category,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      const searchRegex = {
        $regex: safeSearch,
        $options: "i"
      };

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
    }

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Item.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: items.length,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      items
    });

  } catch (error) {
    console.error("Get items error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve items."
    });
  }
};

// Get one item by ID.
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found."
      });
    }

    return res.status(200).json({
      success: true,
      item
    });

  } catch (error) {
    console.error("Get item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve item."
    });
  }
};
