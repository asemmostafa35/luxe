/**
 * E2E Tests — Full User Flow
 *
 * Simulates two complete flows against the live API:
 *
 * Flow A (Admin):
 *   1. Admin logs in
 *   2. Admin creates a product with images + colour variants
 *   3. Verify product appears in list with variants
 *   4. Verify variant colours are stored with colorHex
 *
 * Flow B (Storefront User):
 *   1. Register a new user
 *   2. Fetch the product detail page (getOne by slug)
 *   3. Verify variants are returned with correct color/colorHex fields
 *   4. Verify the product can be added to cart logic (structure check)
 *
 * Run: cd backend && npm test -- --testPathPattern=e2e
 */

import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/server";

// ── Mock email so tests don't need real SMTP ──────────────────────────────────
jest.mock("../src/services/emailService", () => ({
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    sendOrderStatusUpdate: jest.fn().mockResolvedValue(undefined),
    sendLowStockAlert: jest.fn().mockResolvedValue(undefined),
  },
  verifySmtpConnection: jest.fn().mockResolvedValue(undefined),
}));

// ── Shared test state ─────────────────────────────────────────────────────────
let adminToken = "";
let userToken = "";
let createdProductId = "";
let createdProductSlug = "";

const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || "admin@luxefashion.com",
  password: process.env.ADMIN_PASSWORD || "Admin@123456",
};

const TEST_USER_E2E = {
  email: `e2e-user-${Date.now()}@example.com`,
  password: "E2eTestPass123!",
  firstName: "E2E",
  lastName: "Tester",
};

// Product to create during the test
const TEST_PRODUCT = {
  name: `E2E Test Product ${Date.now()}`,
  description:
    "A product created by the E2E test suite to verify variant handling.",
  price: 129.99,
  sku: `E2E-SKU-${Date.now()}`,
  categoryId: "", // filled in after fetching categories
  brand: "TestBrand",
  material: "Cotton",
  tags: ["e2e", "test"],
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  images: [
    {
      url: "http://localhost:5000/uploads/test-e2e.jpg",
      isPrimary: true,
      sortOrder: 0,
    },
  ],
  variants: [
    { size: "S", color: "Ivory", colorHex: "#FFFFF0", stock: 10 },
    { size: "M", color: "Ivory", colorHex: "#FFFFF0", stock: 15 },
    { size: "S", color: "Black", colorHex: "#1a1a1a", stock: 8 },
    { size: "M", color: "Black", colorHex: "#1a1a1a", stock: 12 },
    // ✅ One variant intentionally without colorHex to test the fallback
    { size: "L", color: "Taupe", colorHex: "", stock: 5 },
  ],
};

// ── Setup & teardown ──────────────────────────────────────────────────────────

afterAll(async () => {
  // Clean up test product
  if (createdProductId) {
    await prisma.product
      .delete({ where: { id: createdProductId } })
      .catch(() => {});
  }
  // Clean up test user
  await prisma.user.deleteMany({ where: { email: TEST_USER_E2E.email } });
  await prisma.$disconnect();
});

// ═════════════════════════════════════════════════════════════════════════════
// Flow A — Admin creates product with variants
// ═════════════════════════════════════════════════════════════════════════════

describe("Flow A — Admin creates product with colour variants", () => {
  it("A1: Admin can log in and receive a valid JWT", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send(ADMIN_CREDENTIALS);

    // If admin doesn't exist in the test DB, skip this suite gracefully
    if (res.status === 401) {
      console.warn(
        "⚠️  Admin user not found in DB. Run `npm run db:seed` before E2E tests. Skipping admin flow.",
      );
      return;
    }

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    adminToken = res.body.accessToken;
  });

  it("A2: Admin fetches categories to get a valid categoryId", async () => {
    if (!adminToken) return; // skip if admin login failed

    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);

    // Use the first available category
    TEST_PRODUCT.categoryId = res.body[0].id;
    expect(TEST_PRODUCT.categoryId).toBeTruthy();
  });

  it("A3: Admin creates a product with images and colour variants", async () => {
    if (!adminToken || !TEST_PRODUCT.categoryId) return;

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(TEST_PRODUCT);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("slug");

    createdProductId = res.body.id;
    createdProductSlug = res.body.slug;

    // Verify the product was saved with images
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body.images.length).toBe(1);
    expect(res.body.images[0].url).toBe(
      "http://localhost:5000/uploads/test-e2e.jpg",
    );
  });

  it("A4: Created product appears in the products list", async () => {
    if (!createdProductId) return;

    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);

    // The product is active so it should appear
    const found = res.body.products.find((p: any) => p.id === createdProductId);
    expect(found).toBeDefined();
  });

  it("A5: Product detail includes all variants with color and colorHex", async () => {
    if (!createdProductSlug) return;

    const res = await request(app).get(`/api/products/${createdProductSlug}`);
    expect(res.status).toBe(200);

    const product = res.body.product;
    expect(product.variants.length).toBe(TEST_PRODUCT.variants.length);

    // ✅ KEY: Verify each colour variant has correct fields
    const ivoryVariants = product.variants.filter(
      (v: any) => v.color === "Ivory",
    );
    expect(ivoryVariants.length).toBeGreaterThan(0);
    expect(ivoryVariants[0].colorHex).toBe("#FFFFF0");

    const blackVariants = product.variants.filter(
      (v: any) => v.color === "Black",
    );
    expect(blackVariants[0].colorHex).toBe("#1a1a1a");

    // ✅ KEY: Taupe has empty colorHex — verify it was saved as empty (not null crash)
    const taupeVariants = product.variants.filter(
      (v: any) => v.color === "Taupe",
    );
    expect(taupeVariants.length).toBeGreaterThan(0);
    // colorHex is either empty string or null — both are acceptable
    expect(["", null, undefined]).toContain(taupeVariants[0].colorHex);
  });

  it("A6: Admin can update the product — tags updated, images NOT overwritten", async () => {
    if (!adminToken || !createdProductId) return;

    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `${TEST_PRODUCT.name} (Updated)`,
        price: 149.99,
        tags: ["e2e", "updated"],
        categoryId: TEST_PRODUCT.categoryId,
        description: TEST_PRODUCT.description,
        sku: TEST_PRODUCT.sku,
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toContain("Updated");

    // ✅ KEY: Update must NOT delete existing images
    const detailRes = await request(app).get(
      `/api/products/${createdProductSlug}`,
    );
    expect(detailRes.body.product.images.length).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Flow B — Storefront user browses and selects variants
// ═════════════════════════════════════════════════════════════════════════════

describe("Flow B — Storefront user selects product variants", () => {
  it("B1: User can register and receive tokens", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(TEST_USER_E2E);

    expect([201, 409]).toContain(res.status);
    if (res.status === 201) {
      userToken = res.body.accessToken;
    } else {
      // Log in instead
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: TEST_USER_E2E.email, password: TEST_USER_E2E.password });
      userToken = loginRes.body.accessToken;
    }
    expect(userToken).toBeTruthy();
  });

  it("B2: Storefront product detail returns variants with color/colorHex", async () => {
    // Use a seeded product (slug from seed.ts)
    const res = await request(app).get("/api/products/silk-maxi-dress");

    if (res.status === 404) {
      console.warn(
        '⚠️  Seeded product "silk-maxi-dress" not found. Run `npm run db:seed` first.',
      );
      return;
    }

    expect(res.status).toBe(200);
    const { product } = res.body;

    // ✅ KEY: Verify variants are returned at all
    expect(Array.isArray(product.variants)).toBe(true);
    expect(product.variants.length).toBeGreaterThan(0);

    // ✅ KEY: Each variant must have color and colorHex fields
    product.variants.forEach((v: any) => {
      expect(v).toHaveProperty("color");
      expect(v).toHaveProperty("colorHex");
      expect(v).toHaveProperty("size");
      expect(v).toHaveProperty("stock");
    });

    // ✅ KEY: Deduplicated unique colours
    const uniqueColors = [
      ...new Set(product.variants.map((v: any) => v.color)),
    ];
    expect(uniqueColors.length).toBeGreaterThan(0);
  });

  it("B3: Unique colour deduplication logic matches frontend behaviour", async () => {
    const res = await request(app).get("/api/products/cashmere-turtleneck");

    if (res.status === 404) {
      console.warn(
        '⚠️  Seeded product "cashmere-turtleneck" not found. Skipping.',
      );
      return;
    }

    const { product } = res.body;

    // Simulate exactly what ProductDetailClient.tsx does
    const colors = [
      ...new Map<string, any>(
        product.variants
          .filter((v: any) => v.color)
          .map((v: any) => [
            v.color,
            { color: v.color, colorHex: v.colorHex, stock: v.stock },
          ]),
      ).values(),
    ];

    // Should have 3 colours: Camel, Charcoal, Cream
    expect(colors.length).toBe(3);
    colors.forEach((c) => {
      expect(c.colorHex).toBeTruthy(); // colorHex must be non-empty for seeded products
    });
  });

  it("B4: Cart add-to-bag payload structure is valid", async () => {
    // Simulate what the frontend builds before calling addItem()
    const productRes = await request(app).get("/api/products/silk-maxi-dress");
    if (productRes.status !== 200) return;

    const product = productRes.body.product;
    const selectedSize = product.variants.find((v: any) => v.size)?.size;
    const selectedColor = product.variants.find((v: any) => v.color)?.color;
    const selectedVariant = product.variants.find(
      (v: any) => v.size === selectedSize && v.color === selectedColor,
    );

    // This is the addItem() call shape — validate it has what the cart store needs
    const cartPayload = {
      id: product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price: Number(product.price),
      image: product.images?.[0]?.url,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      maxStock: selectedVariant?.stock ?? 10,
    };

    expect(cartPayload.productId).toBeTruthy();
    expect(cartPayload.price).toBeGreaterThan(0);
    expect(cartPayload.maxStock).toBeGreaterThan(0);
    expect(typeof cartPayload.price).toBe("number");
  });
});
