
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads");

const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const originalPath = req.file.path;
  const outputFilename =
    `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const outputPath = path.join(uploadDir, outputFilename);

  try {
    // Verify the actual image content, not just its MIME type.
    const metadata = await sharp(originalPath, {
      limitInputPixels: 40000000
    }).metadata();

    const allowedFormats = ["jpeg", "png", "webp"];

    if (!allowedFormats.includes(metadata.format)) {
      throw new Error("Only genuine JPEG, PNG, and WebP images are allowed.");
    }

    if (!metadata.width || !metadata.height) {
      throw new Error("Invalid image dimensions.");
    }

    // Re-encode the image as WebP.
    await sharp(originalPath, {
      limitInputPixels: 40000000
    })
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 82 })
      .toFile(outputPath);

    // Remove the original uploaded file.
    await fs.unlink(originalPath);

    // Pass the processed file information to the controller.
    req.file.filename = outputFilename;
    req.file.path = outputPath;
    req.file.mimetype = "image/webp";
    req.file.size = (await fs.stat(outputPath)).size;

    next();

  } catch (error) {
    // Remove temporary and partially processed files.
    await Promise.allSettled([
      fs.unlink(originalPath),
      fs.unlink(outputPath)
    ]);

    console.error("Image processing error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Invalid image. Please upload a valid JPEG, PNG, or WebP file."
    });
  }
};

export default processImage;
