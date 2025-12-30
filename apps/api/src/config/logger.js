/**
 * Configuration du logger centralisé avec Winston
 * Remplace les console.log/warn/error par un système de logging structuré
 */
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Niveaux de log: error, warn, info, http, debug
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Couleurs pour la console en développement
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Format pour les fichiers (JSON structuré)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Format pour la console (lisible)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Déterminer le niveau de log
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Créer le répertoire logs s'il n'existe pas
const logsDir = path.join(__dirname, '../../logs');

// Configuration des transports
const transports = [
  // Fichier pour les erreurs uniquement
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Fichier pour tous les logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Ajouter la console en développement
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Créer le logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Ne pas quitter en cas d'erreur
  exitOnError: false,
});

/**
 * Logger HTTP middleware compatible
 * @param {string} message - Message à logger
 * @param {object} meta - Métadonnées supplémentaires
 */
logger.http = (message, meta = {}) => {
  logger.log('http', message, meta);
};

/**
 * Logger avec contexte pour faciliter le débogage
 * @param {string} context - Contexte (ex: 'AuthService', 'LoanController')
 */
export const createContextLogger = (context) => {
  return {
    error: (message, meta = {}) => logger.error(message, { context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { context, ...meta }),
    info: (message, meta = {}) => logger.info(message, { context, ...meta }),
    http: (message, meta = {}) => logger.http(message, { context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { context, ...meta }),
  };
};

export default logger;
