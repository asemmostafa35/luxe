/** @type {import('jest').Config} */
module.exports = {
  // استخدام preset الأساسي لـ ts-jest
  preset: "ts-jest",
  testEnvironment: "node",

  // 1. تم تعديل المسار ليتماشى مع مجلد test الموجود عندك
  testMatch: ["**/test/**/*.test.ts", "**/test/**/*.spec.ts"],

  // 2. استخدام التعديل الحديث للـ transform بدلاً من الـ globals القديمة
  // هذا التعديل هو المسؤول عن حل مشكلة الـ export/import
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          resolveJsonModule: true,
        },
      },
    ],
  },

  // إعدادات التغطية (Coverage)
  collectCoverageFrom: [
    "src/controllers/**/*.ts",
    "src/services/**/*.ts",
    "!src/**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Timeouts
  testTimeout: 30000,

  // Module name mapper for @/ path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // إعدادات أخرى
  silent: false,
  setupFilesAfterFramework: [],
};
