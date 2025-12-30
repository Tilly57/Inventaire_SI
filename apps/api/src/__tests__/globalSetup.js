/**
 * Jest Global Setup
 *
 * Runs once before all test suites
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function globalSetup() {
  // Load test environment variables BEFORE any tests run
  dotenv.config({ path: join(__dirname, '../../.env.test') });

  // Set test environment
  process.env.NODE_ENV = 'test';

  logger.info('Global setup complete - test environment loaded');
}
