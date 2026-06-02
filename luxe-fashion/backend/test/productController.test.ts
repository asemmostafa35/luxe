/**
 * Unit Tests — productController.ts
 *
 * Tests the core product CRUD logic and the three helper functions
 * that were the source of the 500 errors: normaliseTags,
 * sanitiseImageForCreate, and the Prisma field-stripping in createProduct.
 *
 * Run: cd backend && npm test
 */

import { Request, Response, NextFunction } from "express";

// ── Mock Prisma before importing the controller ──────────────────────────────
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockCount = jest.fn();

jest.mock("../server", () => ({
  prisma: {
    product: {
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      count: (...args: any[]) => mockCount(...args),
    },
  },
}));

// ── Import controller AFTER mocks are set up ─────────────────────────────────
import {
  createProduct,
  updateProduct,
  getProducts,
  deleteProduct,
} from "../controllers/productController";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(
  body: object = {},
  params: object = {},
  query: object = {},
): Request {
  return { body, params, query } as unknown as Request;
}

function makeRes(): { res: Response; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  const res = { json, status } as unknown as Response;
  return { res, json, status };
}

const next: NextFunction = jest.fn();

// ── Reset mocks between tests ─────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// createProduct
// ═════════════════════════════════════════════════════════════════════════════

describe("createProduct", () => {
  const validBody = {
    name: "Test Dress",
    price: "199.99",
    categoryId: "cat-123",
    description: "A beautiful test dress",
    sku: "TEST-001",
  };

  it("creates a product and returns 201 with the saved product", async () => {
    const savedProduct = {
      id: "prod-1",
      ...validBody,
      slug: "test-dress-123",
      tags: [],
    };
    mockCreate.mockResolvedValue(savedProduct);

    const req = makeReq(validBody);
    const { res, status } = makeRes();

    await createProduct(req, res, next);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(201);
  });

  it("returns 400 when name is missing", async () => {
    const { price, categoryId, description, sku } = validBody;
    const req = makeReq({ price, categoryId, description, sku });
    const { res, status } = makeRes();

    await createProduct(req, res, next);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when categoryId is missing", async () => {
    const req = makeReq({
      name: "Dress",
      price: "100",
      description: "X",
      sku: "S1",
    });
    const { res, status } = makeRes();

    await createProduct(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
  });

  // ✅ KEY TEST: tags as comma-string must be converted to array
  it("converts comma-string tags to a string array", async () => {
    const body = { ...validBody, tags: "summer, casual, cotton" };
    mockCreate.mockResolvedValue({
      id: "p1",
      ...body,
      tags: ["summer", "casual", "cotton"],
    });

    const req = makeReq(body);
    const { res } = makeRes();
    await createProduct(req, res, next);

    const callArgs = mockCreate.mock.calls[0][0].data;
    expect(Array.isArray(callArgs.tags)).toBe(true);
    expect(callArgs.tags).toEqual(["summer", "casual", "cotton"]);
  });

  // ✅ KEY TEST: tags already as array must be passed through unchanged
  it("passes through tags that are already an array", async () => {
    const body = { ...validBody, tags: ["summer", "casual"] };
    mockCreate.mockResolvedValue({ id: "p1", ...body });

    const req = makeReq(body);
    const { res } = makeRes();
    await createProduct(req, res, next);

    const callArgs = mockCreate.mock.calls[0][0].data;
    expect(callArgs.tags).toEqual(["summer", "casual"]);
  });

  // ✅ KEY TEST: images must be stripped of DB-only fields before Prisma create
  it("sanitises image objects — strips id, productId, createdAt before create", async () => {
    const body = {
      ...validBody,
      images: [
        {
          id: "img-existing-id", // ← Prisma rejects this on create
          productId: "some-product-id", // ← Prisma rejects this on create
          createdAt: new Date(), // ← Prisma rejects this on create
          url: "http://localhost:5000/uploads/test.jpg",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    };
    mockCreate.mockResolvedValue({ id: "p1", ...validBody });

    const req = makeReq(body);
    const { res } = makeRes();
    await createProduct(req, res, next);

    const createCall = mockCreate.mock.calls[0][0].data;
    const imageCreateData = createCall.images?.create;

    expect(imageCreateData).toBeDefined();
    expect(imageCreateData[0]).not.toHaveProperty("id");
    expect(imageCreateData[0]).not.toHaveProperty("productId");
    expect(imageCreateData[0]).not.toHaveProperty("createdAt");
    expect(imageCreateData[0]).toHaveProperty(
      "url",
      "http://localhost:5000/uploads/test.jpg",
    );
    expect(imageCreateData[0]).toHaveProperty("isPrimary", true);
  });

  // ✅ KEY TEST: variants must not contain DB-only fields
  it("sanitises variant objects — only keeps DB-compatible fields", async () => {
    const body = {
      ...validBody,
      variants: [
        {
          id: "var-123", // ← must be stripped
          productId: "prod-1", // ← must be stripped
          size: "M",
          color: "Black",
          colorHex: "#1a1a1a",
          stock: 10,
          isActive: true,
        },
      ],
    };
    mockCreate.mockResolvedValue({ id: "p1" });

    const req = makeReq(body);
    const { res } = makeRes();
    await createProduct(req, res, next);

    const createCall = mockCreate.mock.calls[0][0].data;
    const variantData = createCall.variants?.create?.[0];

    expect(variantData).toBeDefined();
    expect(variantData).not.toHaveProperty("id");
    expect(variantData).not.toHaveProperty("productId");
    expect(variantData).toHaveProperty("size", "M");
    expect(variantData).toHaveProperty("color", "Black");
  });

  it("does not pass raw images/variants as top-level scalar fields to Prisma", async () => {
    const body = {
      ...validBody,
      images: [
        {
          url: "http://localhost:5000/uploads/a.jpg",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      variants: [{ size: "M", color: "Black", stock: 5 }],
    };
    mockCreate.mockResolvedValue({ id: "p1" });

    const req = makeReq(body);
    const { res } = makeRes();
    await createProduct(req, res, next);

    const callData = mockCreate.mock.calls[0][0].data;
    // images and variants must NOT be plain arrays in the data spread
    expect(callData.images).not.toBeInstanceOf(Array);
    expect(callData.variants).not.toBeInstanceOf(Array);
    // They must be wrapped as Prisma nested writes
    expect(callData.images).toHaveProperty("create");
    expect(callData.variants).toHaveProperty("create");
  });

  it("calls next(err) when Prisma throws", async () => {
    const dbErr = new Error("DB connection failed");
    mockCreate.mockRejectedValue(dbErr);

    const req = makeReq(validBody);
    const { res } = makeRes();
    await createProduct(req, res, next);

    expect(next).toHaveBeenCalledWith(dbErr);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// updateProduct
// ═════════════════════════════════════════════════════════════════════════════

describe("updateProduct", () => {
  it("updates scalar fields and does NOT pass images/variants to Prisma", async () => {
    const body = {
      name: "Updated Dress",
      price: "250",
      tags: ["new", "summer"],
      images: [
        {
          id: "img-1",
          url: "http://x.com/a.jpg",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      variants: [{ id: "var-1", size: "L", stock: 5 }],
    };
    mockUpdate.mockResolvedValue({ id: "prod-1", ...body });

    const req = makeReq(body, { id: "prod-1" });
    const { res, json } = makeRes();
    await updateProduct(req, res, next);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updateData = mockUpdate.mock.calls[0][0].data;

    // ✅ images and variants must NOT appear in update data at all
    expect(updateData).not.toHaveProperty("images");
    expect(updateData).not.toHaveProperty("variants");

    // Scalar fields must be present
    expect(updateData).toHaveProperty("name", "Updated Dress");
    expect(updateData.tags).toEqual(["new", "summer"]);
  });

  it("normalises tags from comma-string on update", async () => {
    mockUpdate.mockResolvedValue({ id: "p1" });
    const req = makeReq(
      { name: "Dress", price: "100", tags: "red, blue" },
      { id: "p1" },
    );
    const { res } = makeRes();
    await updateProduct(req, res, next);

    const tags = mockUpdate.mock.calls[0][0].data.tags;
    expect(tags).toEqual(["red", "blue"]);
  });

  it("calls next(err) when Prisma throws on update", async () => {
    mockUpdate.mockRejectedValue(new Error("Not found"));
    const req = makeReq({ name: "X" }, { id: "bad-id" });
    const { res } = makeRes();
    await updateProduct(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getProducts
// ═════════════════════════════════════════════════════════════════════════════

describe("getProducts", () => {
  it("returns paginated products with correct structure", async () => {
    const fakeProducts = [
      { id: "p1", name: "Dress", images: [], variants: [] },
    ];
    mockFindMany.mockResolvedValue(fakeProducts);
    mockCount.mockResolvedValue(1);

    const req = makeReq({}, {}, { page: "1", limit: "12" });
    const { res, json } = makeRes();
    await getProducts(req, res, next);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        products: fakeProducts,
        pagination: expect.objectContaining({ total: 1, page: 1 }),
      }),
    );
  });

  it("applies search filter correctly", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = makeReq({}, {}, { search: "silk" });
    const { res } = makeRes();
    await getProducts(req, res, next);

    const whereClause = mockFindMany.mock.calls[0][0].where;
    expect(whereClause.OR).toBeDefined();
    expect(whereClause.OR.some((c: any) => c.name?.contains === "silk")).toBe(
      true,
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// deleteProduct (soft delete)
// ═════════════════════════════════════════════════════════════════════════════

describe("deleteProduct", () => {
  it("soft-deletes by setting isActive=false, not hard-deleting", async () => {
    mockUpdate.mockResolvedValue({ id: "p1", isActive: false });

    const req = makeReq({}, { id: "p1" });
    const { res, json } = makeRes();
    await deleteProduct(req, res, next);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { isActive: false },
    });
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
