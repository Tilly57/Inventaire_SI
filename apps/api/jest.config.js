/**
 * Jest Configuration
 *
 * @type {import('jest').Config}
 */
export default {
  // Use node environment for testing
  testEnvironment: 'node',

  // Transform ESM syntax
  transform: {},

  // Module name mapper for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/seeds/**',
    '!**/node_modules/**',
  ],

  coverageDirectory: 'coverage',

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Setup files (runs BEFORE test framework - for env vars)
  setupFiles: ['<rootDir>/src/__tests__/env.js'],

  // Setup files (runs AFTER test framework is installed)
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Verbose output
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Max workers for parallel testing
  maxWorkers: 1, // Run tests serially to avoid DB conflicts
};
