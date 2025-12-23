/**
 * Multer configuration for file uploads
 */
import multer from 'multer';
import path from 'path';
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
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `signature-${uniqueSuffix}${ext}`);
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
