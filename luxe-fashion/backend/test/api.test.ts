/**
 * Integration Tests — emailService + auth API endpoints
 *
 * These tests use supertest to hit the live Express app with a test database.
 * The email service is mocked to avoid real SMTP calls during CI.
 *
 * Run: cd backend && npm test
 */

import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/server";

// ── Mock email service to avoid real SMTP calls in tests ─────────────────────
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

import { emailService } from "../src/services/emailService";

// ── Test user credentials ────────────────────────────────────────────────────
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: "TestPassword123!",
  firstName: "Test",
  lastName: "User",
};

// ── Clean up test data after each suite ──────────────────────────────────────
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  await prisma.$disconnect();
});

// ═════════════════════════════════════════════════════════════════════════════
// Email Service — unit-level with mocks
// ═════════════════════════════════════════════════════════════════════════════

describe("emailService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sendVerificationEmail is called with correct args during registration", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);

    // 201 = created, 409 = already exists (both are acceptable here)
    expect([201, 409]).toContain(res.status);

    if (res.status === 201) {
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        TEST_USER.email,
        TEST_USER.firstName,
        expect.any(String), // token
      );
    }
  });

  it("sendPasswordResetEmail is called when forgotPassword is triggered", async () => {
    // Ensure user exists first
    await request(app)
      .post("/api/auth/register")
      .send(TEST_USER)
      .catch(() => {});

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: TEST_USER.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sent/i);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      TEST_USER.email,
      expect.any(String),
      expect.any(String),
    );
  });

  it("returns 200 for forgotPassword even when email does not exist (anti-enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nonexistent@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sent/i);
    // Must NOT call email service for non-existent user
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Auth API — register / login / refresh
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/auth/register", () => {
  it("returns 201 with tokens and user object", async () => {
    // Use a fresh email for this test to avoid 409
    const freshUser = {
      ...TEST_USER,
      email: `fresh-${Date.now()}@example.com`,
    };
    const res = await request(app).post("/api/auth/register").send(freshUser);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: expect.objectContaining({
        email: freshUser.email,
        firstName: freshUser.firstName,
      }),
    });
    // Clean up
    await prisma.user.deleteMany({ where: { email: freshUser.email } });
  });

  it("returns 409 when email is already registered", async () => {
    // Register once
    await request(app).post("/api/auth/register").send(TEST_USER);
    // Register again with same email
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 200 with tokens for valid credentials", async () => {
    // Ensure user exists
    await request(app)
      .post("/api/auth/register")
      .send(TEST_USER)
      .catch(() => {});

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: "WrongPassword!" });

    expect(res.status).toBe(401);
  });

  it("returns 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "any" });

    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Products API — public endpoints
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/products", () => {
  it("returns 200 with products and pagination", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("products");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it("respects page and limit query params", async () => {
    const res = await request(app).get("/api/products?page=1&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.page).toBe(1);
  });

  it("returns correct structure for each product (includes images array)", async () => {
    const res = await request(app).get("/api/products?limit=1");
    if (res.body.products.length > 0) {
      const p = res.body.products[0];
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("price");
      expect(Array.isArray(p.images)).toBe(true);
      expect(Array.isArray(p.variants)).toBe(true);
    }
  });
});

describe("GET /api/products/featured", () => {
  it("returns 200 with an array", async () => {
    const res = await request(app).get("/api/products/featured");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/categories", () => {
  it("returns 200 with an array of active categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // All returned categories should be active
    res.body.forEach((cat: any) => {
      expect(cat.isActive).toBe(true);
    });
  });
});
