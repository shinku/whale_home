const nextJest = require("next/jest");

// 使用 Next 官方提供的 next/jest，自动接入 SWC 转换与路径别名
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/src/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/tests/**/*.test.ts"],
};

module.exports = createJestConfig(customJestConfig);
