import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin user ─────────────────────────────────────────────────────────────
  const legacyAdmin = await prisma.user.findUnique({
    where: { email: "admin@luxefashion.com" },
  });
  if (legacyAdmin) {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: {
        email: "admin@zanefashion.com",
        firstName: "Zane",
        lastName: "Admin",
        role: Role.SUPER_ADMIN,
      },
    });
    console.log("✓ Migrated legacy admin → admin@zanefashion.com");
  }

  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@zanefashion.com" },
    update: { role: Role.SUPER_ADMIN, firstName: "Zane", lastName: "Admin" },
    create: {
      email: "admin@zanefashion.com",
      password: adminPassword,
      firstName: "Zane",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log("✓ Admin user:", admin.email);

  const editorPassword = await bcrypt.hash("Editor@123", 12);
  const editor = await prisma.user.upsert({
    where: { email: "editor@zanefashion.com" },
    update: { role: Role.EDITOR },
    create: {
      email: "editor@zanefashion.com",
      password: editorPassword,
      firstName: "Elena",
      lastName: "Editor",
      role: Role.EDITOR,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log("✓ Editor user:", editor.email);

  const viewerPassword = await bcrypt.hash("Viewer@123", 12);
  const viewer = await prisma.user.upsert({
    where: { email: "viewer@zanefashion.com" },
    update: { role: Role.VIEWER },
    create: {
      email: "viewer@zanefashion.com",
      password: viewerPassword,
      firstName: "Victor",
      lastName: "Viewer",
      role: Role.VIEWER,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log("✓ Viewer user:", viewer.email);

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "ZANE",
      contactEmail: "hello@zanefashion.com",
      announcementEnabled: true,
    },
  });
  console.log("✓ Store settings");

  // ─── Demo customer ───────────────────────────────────────────────────────────
  const userPassword = await bcrypt.hash("User@123", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@luxefashion.com" },
    update: {},
    create: {
      email: "demo@luxefashion.com",
      password: userPassword,
      firstName: "Alex",
      lastName: "Chen",
      role: Role.USER,
      isEmailVerified: true,
      isActive: true,
      phone: "+1 555 0100",
    },
  });
  console.log("✓ Demo customer:", demoUser.email);

  // ─── Categories ──────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "women" },
      update: {},
      create: {
        name: "Women",
        slug: "women",
        description: "Premium womenswear collection",
        isActive: true,
        sortOrder: 1,
        image:
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
      },
    }),
    prisma.category.upsert({
      where: { slug: "men" },
      update: {},
      create: {
        name: "Men",
        slug: "men",
        description: "Contemporary menswear",
        isActive: true,
        sortOrder: 2,
        image:
          "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&q=80",
      },
    }),
    prisma.category.upsert({
      where: { slug: "dresses" },
      update: {},
      create: {
        name: "Dresses",
        slug: "dresses",
        description: "Elegant dresses for every occasion",
        isActive: true,
        sortOrder: 3,
        image:
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
      },
    }),
    prisma.category.upsert({
      where: { slug: "outerwear" },
      update: {},
      create: {
        name: "Outerwear",
        slug: "outerwear",
        description: "Jackets, coats & blazers",
        isActive: true,
        sortOrder: 4,
        image:
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
      },
    }),
    prisma.category.upsert({
      where: { slug: "accessories" },
      update: {},
      create: {
        name: "Accessories",
        slug: "accessories",
        description: "Complete your look",
        isActive: true,
        sortOrder: 5,
        image:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
      },
    }),
    prisma.category.upsert({
      where: { slug: "knitwear" },
      update: {},
      create: {
        name: "Knitwear",
        slug: "knitwear",
        description: "Cosy knits & sweaters",
        isActive: true,
        sortOrder: 6,
        image:
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
      },
    }),
  ]);
  console.log("✓ Categories:", categories.map((c) => c.name).join(", "));

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c]));

  // ─── Products ────────────────────────────────────────────────────────────────
  const productData = [
    {
      name: "Silk Slip Dress",
      slug: "silk-slip-dress",
      sku: "LXF-W-001",
      price: 189.0,
      comparePrice: 240.0,
      categoryId: catMap["dresses"].id,
      description:
        "A fluid silk slip dress with adjustable straps and a subtle bias cut that drapes beautifully on the body. Finished with a delicate lace trim.",
      material: "100% Mulberry Silk",
      brand: "ZANE",
      tags: ["silk", "dress", "women", "elegant"],
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1566479179817-d3f88dff9c4e?w=800&q=80",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
      variants: [
        { size: "XS", color: "Ivory", colorHex: "#FFFFF0", stock: 8 },
        { size: "S", color: "Ivory", colorHex: "#FFFFF0", stock: 12 },
        { size: "M", color: "Ivory", colorHex: "#FFFFF0", stock: 10 },
        { size: "L", color: "Ivory", colorHex: "#FFFFF0", stock: 6 },
        { size: "XS", color: "Black", colorHex: "#1a1a1a", stock: 10 },
        { size: "S", color: "Black", colorHex: "#1a1a1a", stock: 15 },
        { size: "M", color: "Black", colorHex: "#1a1a1a", stock: 12 },
        { size: "L", color: "Black", colorHex: "#1a1a1a", stock: 8 },
      ],
    },
    {
      name: "Cashmere Turtleneck",
      slug: "cashmere-turtleneck",
      sku: "LXF-W-002",
      price: 245.0,
      comparePrice: null,
      categoryId: catMap["knitwear"].id,
      description:
        "A refined cashmere turtleneck in a relaxed silhouette. Soft to the touch and incredibly warm, this piece elevates any outfit effortlessly.",
      material: "100% Grade-A Cashmere",
      brand: "ZANE",
      tags: ["cashmere", "knitwear", "women", "luxury"],
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=800&q=80",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
      variants: [
        { size: "S", color: "Camel", colorHex: "#C19A6B", stock: 15 },
        { size: "M", color: "Camel", colorHex: "#C19A6B", stock: 20 },
        { size: "L", color: "Camel", colorHex: "#C19A6B", stock: 10 },
        { size: "S", color: "Charcoal", colorHex: "#36454F", stock: 12 },
        { size: "M", color: "Charcoal", colorHex: "#36454F", stock: 18 },
        { size: "L", color: "Charcoal", colorHex: "#36454F", stock: 8 },
        { size: "S", color: "Cream", colorHex: "#FFFDD0", stock: 10 },
        { size: "M", color: "Cream", colorHex: "#FFFDD0", stock: 14 },
      ],
    },
    {
      name: "Tailored Wool Blazer",
      slug: "tailored-wool-blazer",
      sku: "LXF-W-003",
      price: 395.0,
      comparePrice: 495.0,
      categoryId: catMap["outerwear"].id,
      description:
        "A structured single-breasted blazer cut from fine Italian wool. Features notched lapels, two-button front, and a nipped waist for a polished silhouette.",
      material: "80% Wool, 20% Silk",
      brand: "ZANE",
      tags: ["blazer", "outerwear", "women", "tailored", "wool"],
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
      variants: [
        { size: "XS", color: "Black", colorHex: "#1a1a1a", stock: 6 },
        { size: "S", color: "Black", colorHex: "#1a1a1a", stock: 10 },
        { size: "M", color: "Black", colorHex: "#1a1a1a", stock: 8 },
        { size: "L", color: "Black", colorHex: "#1a1a1a", stock: 5 },
        { size: "S", color: "Oat", colorHex: "#E8DCC8", stock: 8 },
        { size: "M", color: "Oat", colorHex: "#E8DCC8", stock: 12 },
        { size: "L", color: "Oat", colorHex: "#E8DCC8", stock: 6 },
      ],
    },
    {
      name: "Linen Wide-Leg Trousers",
      slug: "linen-wide-leg-trousers",
      sku: "LXF-W-004",
      price: 145.0,
      comparePrice: null,
      categoryId: catMap["women"].id,
      description:
        "Relaxed wide-leg trousers crafted from breathable Belgian linen. High-rise waist with a gentle pleat creates an elongating, elegant silhouette.",
      material: "100% Belgian Linen",
      brand: "ZANE",
      tags: ["linen", "trousers", "women", "summer"],
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      variants: [
        { size: "XS", color: "Sand", colorHex: "#C2B280", stock: 12 },
        { size: "S", color: "Sand", colorHex: "#C2B280", stock: 16 },
        { size: "M", color: "Sand", colorHex: "#C2B280", stock: 14 },
        { size: "L", color: "Sand", colorHex: "#C2B280", stock: 10 },
        { size: "XL", color: "Sand", colorHex: "#C2B280", stock: 6 },
        { size: "S", color: "White", colorHex: "#FAFAFA", stock: 14 },
        { size: "M", color: "White", colorHex: "#FAFAFA", stock: 18 },
        { size: "L", color: "White", colorHex: "#FAFAFA", stock: 12 },
      ],
    },
    {
      name: "Merino Crew-Neck Sweater",
      slug: "merino-crew-neck-sweater",
      sku: "LXF-M-001",
      price: 175.0,
      comparePrice: null,
      categoryId: catMap["men"].id,
      description:
        "A lightweight merino wool crew-neck sweater with a classic relaxed fit. An everyday staple for the modern wardrobe, available in a range of versatile tones.",
      material: "100% Extra-Fine Merino Wool",
      brand: "ZANE",
      tags: ["merino", "knitwear", "men", "essentials"],
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=800&q=80",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      variants: [
        { size: "S", color: "Navy", colorHex: "#1B2A4A", stock: 15 },
        { size: "M", color: "Navy", colorHex: "#1B2A4A", stock: 20 },
        { size: "L", color: "Navy", colorHex: "#1B2A4A", stock: 18 },
        { size: "XL", color: "Navy", colorHex: "#1B2A4A", stock: 10 },
        { size: "S", color: "Stone", colorHex: "#918E7E", stock: 12 },
        { size: "M", color: "Stone", colorHex: "#918E7E", stock: 16 },
        { size: "L", color: "Stone", colorHex: "#918E7E", stock: 14 },
        { size: "XL", color: "Stone", colorHex: "#918E7E", stock: 8 },
      ],
    },
    {
      name: "Structured Leather Tote",
      slug: "structured-leather-tote",
      sku: "LXF-A-001",
      price: 320.0,
      comparePrice: null,
      categoryId: catMap["accessories"].id,
      description:
        "A spacious structured tote crafted from full-grain vegetable-tanned leather. Features an interior zip pocket, magnetic closure, and removable base liner.",
      material: "Full-Grain Leather",
      brand: "ZANE",
      tags: ["bag", "leather", "accessories", "tote"],
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
      variants: [
        { color: "Cognac", colorHex: "#9B4A1B", stock: 20 },
        { color: "Black", colorHex: "#1a1a1a", stock: 25 },
        { color: "Taupe", colorHex: "#B0A090", stock: 15 },
      ],
    },
    {
      name: "Classic Oxford Shirt",
      slug: "classic-oxford-shirt",
      sku: "LXF-M-002",
      price: 120.0,
      comparePrice: 150.0,
      categoryId: catMap["men"].id,
      description:
        "A timeless button-down Oxford shirt in a comfortable slim fit. Crafted from brushed cotton with subtle texture and finished with a button-down collar.",
      material: "100% Brushed Cotton",
      brand: "ZANE",
      tags: ["shirt", "men", "oxford", "essentials"],
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      variants: [
        { size: "S", color: "White", colorHex: "#FAFAFA", stock: 20 },
        { size: "M", color: "White", colorHex: "#FAFAFA", stock: 25 },
        { size: "L", color: "White", colorHex: "#FAFAFA", stock: 20 },
        { size: "XL", color: "White", colorHex: "#FAFAFA", stock: 15 },
        { size: "S", color: "Blue", colorHex: "#5B7FA6", stock: 16 },
        { size: "M", color: "Blue", colorHex: "#5B7FA6", stock: 20 },
        { size: "L", color: "Blue", colorHex: "#5B7FA6", stock: 18 },
      ],
    },
    {
      name: "Wrap Midi Dress",
      slug: "wrap-midi-dress",
      sku: "LXF-W-005",
      price: 165.0,
      comparePrice: 200.0,
      categoryId: catMap["dresses"].id,
      description:
        "An elegant wrap midi dress in a flowing crepe fabric. The adjustable tie waist creates a universally flattering silhouette for any occasion.",
      material: "95% Viscose, 5% Elastane",
      brand: "ZANE",
      tags: ["dress", "women", "midi", "wrap"],
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      variants: [
        { size: "XS", color: "Terracotta", colorHex: "#C1671A", stock: 8 },
        { size: "S", color: "Terracotta", colorHex: "#C1671A", stock: 12 },
        { size: "M", color: "Terracotta", colorHex: "#C1671A", stock: 10 },
        { size: "L", color: "Terracotta", colorHex: "#C1671A", stock: 6 },
        { size: "S", color: "Forest", colorHex: "#355E3B", stock: 10 },
        { size: "M", color: "Forest", colorHex: "#355E3B", stock: 14 },
        { size: "L", color: "Forest", colorHex: "#355E3B", stock: 8 },
      ],
    },
  ];

  let productCount = 0;
  for (const pd of productData) {
    const { images, variants, ...productFields } = pd;
    const existing = await prisma.product.findUnique({
      where: { slug: pd.slug },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          ...productFields,
          images: { create: images },
          variants: { create: variants },
          avgRating: 0,
          reviewCount: 0,
          totalSold: Math.floor(Math.random() * 200) + 10,
        },
      });
      productCount++;
    }
  }
  console.log(`✓ Products: ${productCount} created`);

  // ─── Coupons ─────────────────────────────────────────────────────────────────
  const coupons = [
    {
      code: "WELCOME10",
      description: "New customer discount",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 50,
      isActive: true,
    },
    {
      code: "SUMMER20",
      description: "Summer sale 20% off",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderAmount: 100,
      maxDiscount: 50,
      isActive: true,
      expiresAt: new Date("2026-08-31"),
    },
    {
      code: "FREESHIP",
      description: "Free shipping",
      discountType: "FIXED",
      discountValue: 9.99,
      minOrderAmount: 0,
      isActive: true,
    },
    {
      code: "VIP30",
      description: "VIP 30% discount",
      discountType: "PERCENTAGE",
      discountValue: 30,
      minOrderAmount: 200,
      maxDiscount: 100,
      usageLimit: 50,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c as any,
    });
  }
  console.log("✓ Coupons: 4 created");

  // ─── Banners ─────────────────────────────────────────────────────────────────
  await prisma.banner.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "New Season Arrivals",
        subtitle: "Spring / Summer 2026",
        image:
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&q=80",
        link: "/new-arrivals",
        buttonText: "Shop Now",
        position: "hero",
        sortOrder: 0,
        isActive: true,
      },
      {
        title: "Best Sellers",
        subtitle: "Our Most-Loved Pieces",
        image:
          "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1400&q=80",
        link: "/best-sellers",
        buttonText: "Discover",
        position: "hero",
        sortOrder: 1,
        isActive: true,
      },
    ],
  });
  console.log("✓ Banners created");

  // ─── Announcements ───────────────────────────────────────────────────────────
  await prisma.announcement
    .create({
      data: {
        message:
          "Free shipping on all orders over $100 · Use code WELCOME10 for 10% off your first order",
        type: "info",
        isActive: true,
      },
    })
    .catch(() => {});
  console.log("✓ Announcements created");

  // ─── Sample reviews ──────────────────────────────────────────────────────────
  const products = await prisma.product.findMany({ take: 3 });
  for (const product of products) {
    const existingReview = await prisma.review.findFirst({
      where: { productId: product.id, userId: demoUser.id },
    });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: demoUser.id,
          rating: 5,
          title: "Absolutely stunning quality",
          body: "This piece exceeded my expectations. The fabric feels incredibly luxurious and the fit is perfect. Will definitely be ordering more pieces from ZANE.",
          isApproved: true,
          isVerified: true,
        },
      });
      await prisma.product.update({
        where: { id: product.id },
        data: { avgRating: 5, reviewCount: 1 },
      });
    }
  }
  console.log("✓ Sample reviews created");

  // ─── Sample address for demo user ────────────────────────────────────────────
  const existingAddress = await prisma.address.findFirst({
    where: { userId: demoUser.id },
  });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: demoUser.id,
        label: "Home",
        firstName: "Alex",
        lastName: "Chen",
        phone: "+1 555 0100",
        street: "123 Fashion Avenue",
        city: "New York",
        state: "NY",
        country: "United States",
        postalCode: "10001",
        isDefault: true,
      },
    });
  }
  console.log("✓ Demo address created");

  console.log("\n✅ Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Super Admin   → admin@zanefashion.com  / Admin@123");
  console.log("Editor        → editor@zanefashion.com / Editor@123");
  console.log("Viewer        → viewer@zanefashion.com / Viewer@123");
  console.log("Demo login    → demo@luxefashion.com   / User@123");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
