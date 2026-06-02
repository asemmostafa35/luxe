// backend/jest.config.js
//
// Production-ready Jest configuration for the Luxe Fashion backend.
// Uses ts-jest exclusively — zero Babel involvement.
//
// Every decision is annotated so you know exactly what each line does
// and why the previous config was causing SyntaxErrors.

"use strict";

/** @type {import('jest').Config} */
module.exports = {
  displayName: "BACKEND",
  rootDir: "..",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        diagnostics: {
          warnOnly: true,
          ignoreCodes: ["TS151001"],
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(uuid|@prisma/client|nodemailer)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^\\.\\./server$": "<rootDir>/src/server",
    "^\\.\\./\\.\\./server$": "<rootDir>/src/server",
    "^\\.\\./controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^\\.\\./\\.\\./services/(.*)$": "<rootDir>/src/services/$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],
  testMatch: ["<rootDir>/test/**/*.test.ts", "<rootDir>/test/**/*.spec.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/dist-seed/"],
  collectCoverageFrom: [
    "src/controllers/**/*.ts",
    "src/services/**/*.ts",
    "src/middleware/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  testTimeout: 30000,
  clearMocks: true,
  resetMocks: false,
  verbose: true,
};
