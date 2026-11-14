import { validationResult } from "express-validator";
import fs from "node:fs/promises";

const validateRequest = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Remove the processed image if item validation fails.
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Uploaded image cleanup failed:", error.message);
        }
      }
    }

    return res.status(400).json({
      success: false,
      message: "Please check the submitted information.",
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }

  next();
};

export default validateRequest;
