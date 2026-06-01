import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise the `tags` field to always be a string array.
 * The frontend sends string[] but defensively handle a comma-string too.
 */
function normaliseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.length > 0)
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  return [];
}

/**
 * Strip fields that Prisma does not accept on ProductImage create
 * (id, productId, createdAt come back from the DB when editing).
 */
function sanitiseImageForCreate(img: any) {
  return {
    url: img.url,
    alt: img.alt ?? null,
    isPrimary: img.isPrimary ?? false,
    sortOrder: img.sortOrder ?? 0,
  };
}

/**
 * Strip fields that Prisma does not accept on ProductVariant create.
 */
function sanitiseVariantForCreate(v: any) {
  return {
    size: v.size ?? null,
    color: v.color ?? null,
    colorHex: v.colorHex ?? null,
    stock: Number(v.stock) || 0,
    price: v.price != null ? new Prisma.Decimal(v.price) : null,
    isActive: v.isActive ?? true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────────────────────────────────────

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = "1",
      limit = "12",
      category,
      search,
      sort = "createdAt",
      order = "desc",
      minPrice,
      maxPrice,
      isNew,
      isBest,
      isFeatured,
      size,
      color,
      tags,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(category && { category: { slug: category as string } }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } },
          { brand: { contains: search as string, mode: "insensitive" } },
          { tags: { has: search as string } },
        ],
      }),
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice && { gte: new Prisma.Decimal(minPrice as string) }),
              ...(maxPrice && { lte: new Prisma.Decimal(maxPrice as string) }),
            },
          }
        : {}),
      ...(isNew === "true" && { isNewArrival: true }),
      ...(isBest === "true" && { isBestSeller: true }),
      ...(isFeatured === "true" && { isFeatured: true }),
      ...(color && {
        variants: {
          some: { color: { contains: color as string, mode: "insensitive" } },
        },
      }),
      ...(size && {
        variants: {
          some: { size: { contains: size as string, mode: "insensitive" } },
        },
      }),
      ...(tags && { tags: { hasSome: (tags as string).split(",") } }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price"
        ? { price: order as "asc" | "desc" }
        : sort === "rating"
          ? { avgRating: order as "asc" | "desc" }
          : sort === "sold"
            ? { totalSold: order as "asc" | "desc" }
            : sort === "name"
              ? { name: order as "asc" | "desc" }
              : { createdAt: order as "asc" | "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          // ✅ Fetch ALL images (not just isPrimary) so the admin table and
          //    ProductCard hover-swap both have the second image available.
          images: { orderBy: { sortOrder: "asc" } },
          category: { select: { id: true, name: true, slug: true } },
          variants: {
            where: { isActive: true },
            select: { size: true, color: true, colorHex: true, stock: true },
          },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        variants: { where: { isActive: true } },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 8,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });

    res.json({ product, related });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!data.name)
      return res.status(400).json({ message: "Product name is required" });
    if (!data.price)
      return res.status(400).json({ message: "Price is required" });
    if (!data.categoryId)
      return res.status(400).json({ message: "Category is required" });

    const slug =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    // ── Normalise tags ────────────────────────────────────────────────────────
    const tags = normaliseTags(data.tags);

    // ── Safely extract relational arrays ─────────────────────────────────────
    // ✅ FIX: Destructure images/variants out of the spread so they don't land
    // in the Prisma scalar fields. Then sanitise each image/variant object to
    // only include the columns that ProductImage / ProductVariant accept on
    // CREATE — stripping id, productId, createdAt, updatedAt which come back
    // from the DB when the user is editing an existing product.
    const { images, variants, tags: _tags, ...scalarData } = data;

    const imageCreateData =
      Array.isArray(images) && images.length > 0
        ? images.map(sanitiseImageForCreate)
        : undefined;

    const variantCreateData =
      Array.isArray(variants) && variants.length > 0
        ? variants.map(sanitiseVariantForCreate)
        : undefined;

    const product = await prisma.product.create({
      data: {
        ...scalarData,
        slug,
        tags,
        price: new Prisma.Decimal(data.price),
        comparePrice: data.comparePrice
          ? new Prisma.Decimal(data.comparePrice)
          : null,
        cost: data.cost ? new Prisma.Decimal(data.cost) : null,
        images: imageCreateData ? { create: imageCreateData } : undefined,
        variants: variantCreateData ? { create: variantCreateData } : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        category: true,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // ── Strip relational fields ───────────────────────────────────────────────
    // ✅ FIX: Never pass images/variants in a Prisma update's `data` object —
    // Prisma requires an explicit nested write operation ({ upsert/create/... })
    // not raw arrays. For the update flow we leave existing images alone; the
    // admin can delete and re-upload from the product form.
    const {
      images: _images,
      variants: _variants,
      tags: _tags,
      ...scalarData
    } = data;

    const tags = data.tags !== undefined ? normaliseTags(data.tags) : undefined;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...scalarData,
        ...(tags !== undefined && { tags }),
        price: data.price ? new Prisma.Decimal(data.price) : undefined,
        comparePrice: data.comparePrice
          ? new Prisma.Decimal(data.comparePrice)
          : null,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
        category: true,
      },
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};

export const getFeatured = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: 8,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 2 },
        category: { select: { name: true, slug: true } },
      },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

export const getNewArrivals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await prisma.product.findMany({
      where: { isNewArrival: true, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 16,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 2 },
        category: { select: { name: true, slug: true } },
      },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

export const getBestSellers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await prisma.product.findMany({
      where: { isBestSeller: true, isActive: true },
      orderBy: { totalSold: "desc" },
      take: 16,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 2 },
        category: { select: { name: true, slug: true } },
      },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
};
