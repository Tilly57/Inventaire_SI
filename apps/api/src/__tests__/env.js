/**
 * Environment Setup for Tests
 *
 * This file is loaded BEFORE the test framework is installed
 * to ensure environment variables are available
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
const result = dotenv.config({ path: join(__dirname, '../../.env.test') });

if (result.error) {
  console.error('Failed to load .env.test:', result.error);
  // Fall back to .env
  dotenv.config({ path: join(__dirname, '../../.env') });
}

// Set test environment
process.env.NODE_ENV = 'test';
