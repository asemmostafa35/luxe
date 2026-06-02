import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Routes
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import categoryRoutes from "./routes/categories";
import orderRoutes from "./routes/orders";
import userRoutes from "./routes/users";
import cartRoutes from "./routes/cart";
import wishlistRoutes from "./routes/wishlist";
import reviewRoutes from "./routes/reviews";
import couponRoutes from "./routes/coupons";
import bannerRoutes from "./routes/banners";
import adminRoutes, { publicSettingsRouter } from "./routes/admin";
import adminReviewRoutes from "./routes/adminReviews";
import cloudinaryUploadRouter from "./services/cloudinaryService";
import contactRoutes from "./routes/contact";
import newsletterRoutes from "./routes/newsletter";
import analyticsRoutes from "./routes/analytics";

// Middleware
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

// ✅ FIX: Import and call SMTP verification on startup
import { verifySmtpConnection } from "./services/emailService";

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:3000").split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

app.use(compression());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Serve local uploads (fallback when Cloudinary not configured)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/settings", publicSettingsRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/upload", cloudinaryUploadRouter);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, async () => {
    console.log(`🚀 ZANE API  →  http://localhost:${PORT}`);
    console.log(
      `📊 Environment       →  ${process.env.NODE_ENV || "development"}`,
    );
    await verifySmtpConnection();
  });
}

export default app;
