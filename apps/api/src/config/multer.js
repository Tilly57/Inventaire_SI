/**
 * Multer configuration for file uploads
 */
import multer from 'multer';
import path from 'path';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../utils/constants.js';
import { ValidationError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.SIGNATURES_DIR || path.join(__dirname, '../../uploads/signatures');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Génération sécurisée d'un nom de fichier unique avec crypto.randomBytes
    // 16 bytes = 32 caractères hexadécimaux (collision quasi impossible)
    const secureRandomName = randomBytes(16).toString('hex');
    const timestamp = Date.now(); // Ajouté pour faciliter le tri chronologique
    const ext = path.extname(file.originalname);

    // Format: signature-timestamp-randomhex.ext
    // Exemple: signature-1704645123456-a3f2c1b9e8d7f6a5b4c3d2e1f0a9b8c7.png
    cb(null, `signature-${timestamp}-${secureRandomName}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Type de fichier non autorisé. Seuls PNG et JPG sont acceptés.'), false);
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});
