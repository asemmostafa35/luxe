import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { authenticate } from "../middleware/auth";
import { requirePermission, requireStaff } from "../middleware/rbac";

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function uploadFile(buffer: Buffer): Promise<string> {
  const hasCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your-cloud-name";

  if (hasCloudinary) {
    // ── Cloudinary path: returns a full https:// URL automatically ──────────
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "luxe-fashion/products",
            resource_type: "image",
            transformation: [
              { width: 1200, height: 1600, crop: "limit" },
              { quality: "auto:good" },
              { fetch_format: "auto" },
            ],
          },
          (err, result) => {
            if (err || !result)
              return reject(err || new Error("Upload failed"));
            resolve(result.secure_url); // already absolute: https://res.cloudinary.com/...
          },
        )
        .end(buffer);
    });
  } else {
    // ── Local fallback ───────────────────────────────────────────────────────
    // ✅ FIX: The original code returned a RELATIVE path like `/uploads/uuid.jpg`.
    // The frontend uses Next.js <Image> which requires an absolute URL when the
    // image is served from a different origin (Express on :5000, not Next on :3000).
    // A relative path like `/uploads/...` resolves to localhost:3000/uploads/...
    // which 404s because Next.js does not serve that directory.
    //
    // Fix: return a full absolute URL using the backend's own origin so the
    // browser (and next/image) can fetch it from http://localhost:5000/uploads/...
    const optimised = await sharp(buffer)
      .resize(1200, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    const filename = `${uuidv4()}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, optimised);

    // Build absolute URL from the backend's own base URL.
    // BACKEND_URL must NOT end with a trailing slash.
    const backendUrl = (
      process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`
    ).replace(/\/$/, "");

    return `${backendUrl}/uploads/${filename}`;
    // e.g. "http://localhost:5000/uploads/3f8a1b2c-....jpg"
    // This is already in next.config.js remotePatterns:
    //   { protocol: 'http', hostname: 'localhost' }  ✓
  }
}

router.post(
  "/",
  authenticate,
  requireStaff,
  requirePermission("products:write"),
  upload.array("images", 10),
  async (req: any, res, next) => {
    try {
      const files: Express.Multer.File[] = req.files || [];
      if (!files.length)
        return res.status(400).json({ error: "No images provided" });

      const urls = await Promise.all(files.map((f) => uploadFile(f.buffer)));
      res.json({ urls });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
