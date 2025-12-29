/**
 * Jest Setup File
 *
 * Runs after test framework is installed
 * Environment variables are already loaded by env.js
 */

import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(10000);

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
