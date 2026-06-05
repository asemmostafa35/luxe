import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { Prisma } from "@prisma/client";

function normaliseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.length > 0)
    return raw.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

function sanitiseImageForCreate(img: any) {
  return {
    url: img.url,
    alt: img.alt ?? null,
    isPrimary: img.isPrimary ?? false,
    sortOrder: img.sortOrder ?? 0,
    colorHex: img.colorHex ?? null,
  };
}

function normalizeColorHex(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  let hex = String(raw).trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return `#${hex.toUpperCase()}`;
}

function sanitiseVariantForCreate(v: any) {
  const size = v.size != null && String(v.size).trim() !== "" ? String(v.size).trim() : null;
  const colorHex = normalizeColorHex(v.colorHex);
  const color = colorHex ?? (v.color != null && String(v.color).trim() !== "" ? String(v.color).trim() : null);
  return {
    size,
    color,
    colorHex,
    stock: Math.max(0, Number(v.stock) || 0),
    price: v.price != null && v.price !== "" ? new Prisma.Decimal(v.price) : null,
    isActive: v.isActive ?? true,
  };
}

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = "1", limit = "12", category, search,
      sort = "createdAt", order = "desc",
      minPrice, maxPrice, isNew, isBest, isFeatured, size, color, tags,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const variantFilters: Prisma.ProductVariantWhereInput = {};
    if (color) variantFilters.color = { contains: color as string, mode: "insensitive" };
    if (size) variantFilters.size = { contains: size as string, mode: "insensitive" };

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(category && { category: { slug: category as string, isActive: true } }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } },
          { brand: { contains: search as string, mode: "insensitive" } },
          { tags: { has: search as string } },
        ],
      }),
      ...(minPrice || maxPrice ? {
        price: {
          ...(minPrice && { gte: new Prisma.Decimal(minPrice as string) }),
          ...(maxPrice && { lte: new Prisma.Decimal(maxPrice as string) }),
        },
      } : {}),
      ...(isNew === "true" && { isNewArrival: true }),
      ...(isBest === "true" && { isBestSeller: true }),
      ...(isFeatured === "true" && { isFeatured: true }),
      ...((color || size) && { variants: { some: variantFilters } }),
      ...(tags && {
        tags: {
          hasSome: (tags as string).split(",").map((t) => t.trim()).filter(Boolean),
        },
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price" ? { price: order as "asc" | "desc" } :
      sort === "rating" ? { avgRating: order as "asc" | "desc" } :
      sort === "sold" ? { totalSold: order as "asc" | "desc" } :
      sort === "name" ? { name: order as "asc" | "desc" } :
      { createdAt: order as "asc" | "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: Number(limit), orderBy,
        include: {
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
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
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
          include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      take: 8,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });

    res.json({ product, related });
  } catch (err) { next(err); }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    if (!data.name) return res.status(400).json({ message: "Product name is required" });
    if (!data.price) return res.status(400).json({ message: "Price is required" });
    if (!data.categoryId) return res.status(400).json({ message: "Category is required" });

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    const tags = normaliseTags(data.tags);
    const { images, variants, tags: _tags, ...scalarData } = data;

    const imageCreateData = Array.isArray(images) && images.length > 0 ? images.map(sanitiseImageForCreate) : undefined;
    const variantCreateData = Array.isArray(variants) && variants.length > 0 ? variants.map(sanitiseVariantForCreate) : undefined;

    const product = await prisma.product.create({
      data: {
        ...scalarData,
        slug,
        tags,
        price: new Prisma.Decimal(data.price),
        comparePrice: data.comparePrice ? new Prisma.Decimal(data.comparePrice) : null,
        cost: data.cost ? new Prisma.Decimal(data.cost) : null,
        costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : null,
        images: imageCreateData ? { create: imageCreateData } : undefined,
        variants: variantCreateData ? { create: variantCreateData } : undefined,
      },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, category: true },
    });

    res.status(201).json(product);
  } catch (err) { next(err); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { images, variants, tags: _tags, ...scalarData } = data;
    const tags = data.tags !== undefined ? normaliseTags(data.tags) : undefined;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...scalarData,
        ...(tags !== undefined && { tags }),
        price: data.price ? new Prisma.Decimal(data.price) : undefined,
        comparePrice: data.comparePrice ? new Prisma.Decimal(data.comparePrice) : null,
        costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : null,
        ...(Array.isArray(images) && {
          images: { deleteMany: {}, create: images.map(sanitiseImageForCreate) },
        }),
        ...(Array.isArray(variants) && {
          variants: { deleteMany: {}, create: variants.map(sanitiseVariantForCreate) },
        }),
      },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: { where: { isActive: true } }, category: true },
    });

    res.json(product);
  } catch (err) { next(err); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    res.json({ message: "Product deleted" });
  } catch (err) { next(err); }
};

export const getFeatured = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: 8,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, category: { select: { name: true, slug: true } } },
    });
    res.json(products);
  } catch (err) { next(err); }
};

export const getNewArrivals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isNewArrival: true, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 16,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, category: { select: { name: true, slug: true } } },
    });
    res.json(products);
  } catch (err) { next(err); }
};

export const getBestSellers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isBestSeller: true, isActive: true },
      orderBy: { totalSold: "desc" },
      take: 16,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, category: { select: { name: true, slug: true } } },
    });
    res.json(products);
  } catch (err) { next(err); }
};
