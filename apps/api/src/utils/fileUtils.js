/**
 * @fileoverview File utilities for managing signature files
 *
 * Provides functions to delete signature files from the filesystem
 * with error resilience to prevent blocking database operations.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Delete a single signature file
 *
 * Deletes a signature file from the filesystem. If the file doesn't exist
 * or deletion fails, the error is logged but not thrown to prevent blocking
 * database deletion operations.
 *
 * @param {string} signatureUrl - URL/path of signature file
 * @returns {Promise<void>}
 *
 * @example
 * await deleteSignatureFile('/signatures/1234567890.png');
 * // File deleted or error logged
 */
export async function deleteSignatureFile(signatureUrl) {
  if (!signatureUrl) return;

  try {
    // Extract filename only (security: prevent path traversal)
    const filename = path.basename(signatureUrl);

    // Resolve full path to signatures directory
    const signaturesDir = process.env.SIGNATURES_DIR || path.join(__dirname, '../../../../uploads/signatures');
    const filePath = path.join(signaturesDir, filename);

    // Delete file
    await fs.unlink(filePath);
    console.log(`[FileUtils] Deleted signature: ${filename}`);
  } catch (error) {
    // Log but don't throw (allows DB deletion to proceed)
    console.error(`[FileUtils] Failed to delete signature ${signatureUrl}:`, error.message);
  }
}

/**
 * Delete multiple signature files in parallel
 *
 * Deletes multiple signature files concurrently using Promise.allSettled
 * to ensure all deletions are attempted even if some fail.
 *
 * @param {string[]} signatureUrls - Array of signature URLs
 * @returns {Promise<void>}
 *
 * @example
 * await deleteSignatureFiles([
 *   '/signatures/pickup123.png',
 *   '/signatures/return456.png'
 * ]);
 * // All files deleted or errors logged
 */
export async function deleteSignatureFiles(signatureUrls) {
  const validUrls = signatureUrls.filter(url => url);
  await Promise.allSettled(validUrls.map(url => deleteSignatureFile(url)));
}