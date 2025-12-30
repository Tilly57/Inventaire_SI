/**
 * @fileoverview Utility function to save base64 images to file system
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Save a base64 image string to the signatures directory
 *
 * @param {string} base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param {string} signaturesDir - Directory path where signatures are stored
 * @returns {Promise<string>} - Filename of the saved image
 *
 * @example
 * const filename = await saveBase64Image('data:image/png;base64,iVBOR...', '/app/uploads/signatures')
 * // Returns: '1234567890-signature.png'
 */
export async function saveBase64Image(base64Data, signaturesDir) {
  // Remove data URL prefix if present (data:image/png;base64,)
  const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Convert base64 to buffer
  const imageBuffer = Buffer.from(base64String, 'base64');

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const filename = `${timestamp}-${randomString}-signature.png`;

  // Ensure directory exists
  await fs.mkdir(signaturesDir, { recursive: true });

  // Save file
  const filepath = path.join(signaturesDir, filename);
  await fs.writeFile(filepath, imageBuffer);

  return filename;
}
