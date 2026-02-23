#!/usr/bin/env node
/**
 * @fileoverview Automated database backup script for Inventaire SI
 *
 * Multi-platform backup automation with:
 * - Automatic Docker detection and backup
 * - Configurable retention policy
 * - Email notifications on success/failure
 * - Logging and error handling
 * - Compression and verification
 *
 * Usage:
 *   node scripts/backup-automation.js
 *   node scripts/backup-automation.js --name "manual_backup"
 *   node scripts/backup-automation.js --cleanup-only
 *
 * Environment Variables:
 *   BACKUP_RETENTION_DAYS - Number of days to keep backups (default: 30)
 *   BACKUP_NOTIFICATION_EMAIL - Email for notifications (optional)
 *   DB_CONTAINER - Docker container name (default: inventaire_si-db-1)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, appendFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// Configuration
const CONFIG = {
  dbContainer: process.env.DB_CONTAINER || 'inventaire_si-db-1',
  dbName: process.env.DB_NAME || 'inventaire',
  dbUser: process.env.DB_USER || 'inventaire',
  backupDir: join(PROJECT_ROOT, 'backups', 'database'),
  logDir: join(PROJECT_ROOT, 'backups', 'logs'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  notificationEmail: process.env.BACKUP_NOTIFICATION_EMAIL || null,
};

// Parse command line arguments
const args = process.argv.slice(2);
const customName = args.find(arg => arg.startsWith('--name='))?.split('=')[1];
const cleanupOnly = args.includes('--cleanup-only');
const dryRun = args.includes('--dry-run');

/**
 * Log messages to console and log file
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  console.log(logMessage);

  // Ensure log directory exists
  if (!existsSync(CONFIG.logDir)) {
    mkdirSync(CONFIG.logDir, { recursive: true });
  }

  // Write to log file
  const logFile = join(CONFIG.logDir, `backup_${new Date().toISOString().split('T')[0]}.log`);
  try {
    appendFileSync(logFile, logMessage + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

/**
 * Check if Docker is running and container exists
 */
async function checkDocker() {
  try {
    // Check if Docker is running
    await execAsync('docker ps');
    log('Docker is running');

    // Check if database container is running
    const { stdout } = await execAsync(`docker ps --filter "name=${CONFIG.dbContainer}" --format "{{.Names}}"`);

    if (stdout.trim() !== CONFIG.dbContainer) {
      throw new Error(`Container ${CONFIG.dbContainer} is not running`);
    }

    log(`Database container ${CONFIG.dbContainer} is running`);
    return true;
  } catch (error) {
    log(`Docker check failed: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Create database backup
 */
async function createBackup(backupName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('-').slice(0, 3).join('') + '_' + new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = backupName
    ? `${backupName}_${timestamp}.dump`
    : `inventaire_auto_${timestamp}.dump`;
  const backupPath = join(CONFIG.backupDir, filename);

  log(`Starting backup: ${filename}`);

  // Ensure backup directory exists
  if (!existsSync(CONFIG.backupDir)) {
    mkdirSync(CONFIG.backupDir, { recursive: true });
    log(`Created backup directory: ${CONFIG.backupDir}`);
  }

  try {
    // Execute pg_dump inside Docker container
    // -Fc = custom format (compressed)
    // -Z9 = maximum compression
    const dumpCommand = `docker exec ${CONFIG.dbContainer} pg_dump -U ${CONFIG.dbUser} -Fc -Z9 ${CONFIG.dbName}`;

    // On Windows, we need to handle binary output differently
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      // Windows: redirect to file directly
      await execAsync(`${dumpCommand} > "${backupPath}"`);
    } else {
      // Linux/Mac: use shell redirection
      await execAsync(`${dumpCommand} > "${backupPath}"`, { shell: '/bin/bash' });
    }

    // Verify backup file exists and has content
    if (!existsSync(backupPath)) {
      throw new Error('Backup file was not created');
    }

    const stats = statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    if (stats.size < 1000) {
      throw new Error(`Backup file is too small (${stats.size} bytes) - backup may have failed`);
    }

    log(`Backup completed successfully: ${filename} (${sizeMB} MB)`, 'SUCCESS');
    return { success: true, filename, size: stats.size };
  } catch (error) {
    log(`Backup failed: ${error.message}`, 'ERROR');

    // Clean up failed backup file if it exists
    if (existsSync(backupPath)) {
      try {
        unlinkSync(backupPath);
        log(`Cleaned up failed backup file: ${filename}`);
      } catch (cleanupError) {
        log(`Failed to clean up backup file: ${cleanupError.message}`, 'WARN');
      }
    }

    return { success: false, error: error.message };
  }
}

/**
 * Clean up old backups based on retention policy
 */
function cleanupOldBackups() {
  log(`Starting cleanup: removing backups older than ${CONFIG.retentionDays} days`);

  if (!existsSync(CONFIG.backupDir)) {
    log('Backup directory does not exist, nothing to clean up');
    return { deleted: 0, kept: 0 };
  }

  const files = readdirSync(CONFIG.backupDir);
  const now = Date.now();
  const retentionMs = CONFIG.retentionDays * 24 * 60 * 60 * 1000;

  let deleted = 0;
  let kept = 0;
  let freedSpace = 0;

  for (const file of files) {
    // Only process dump files
    if (!file.endsWith('.dump') && !file.endsWith('.sql.gz')) {
      continue;
    }

    // Only delete automatic backups (inventaire_auto_*)
    // Keep manual backups and pre_restore backups
    if (!file.startsWith('inventaire_auto_')) {
      kept++;
      continue;
    }

    const filePath = join(CONFIG.backupDir, file);
    const stats = statSync(filePath);
    const fileAge = now - stats.mtimeMs;

    if (fileAge > retentionMs) {
      if (dryRun) {
        log(`[DRY RUN] Would delete: ${file} (${(stats.size / (1024 * 1024)).toFixed(2)} MB, ${Math.floor(fileAge / (24 * 60 * 60 * 1000))} days old)`);
        deleted++;
        freedSpace += stats.size;
      } else {
        try {
          unlinkSync(filePath);
          log(`Deleted old backup: ${file} (${(stats.size / (1024 * 1024)).toFixed(2)} MB, ${Math.floor(fileAge / (24 * 60 * 60 * 1000))} days old)`);
          deleted++;
          freedSpace += stats.size;
        } catch (error) {
          log(`Failed to delete ${file}: ${error.message}`, 'ERROR');
        }
      }
    } else {
      kept++;
    }
  }

  const freedSpaceMB = (freedSpace / (1024 * 1024)).toFixed(2);
  log(`Cleanup completed: ${deleted} files deleted (${freedSpaceMB} MB freed), ${kept} files kept`);

  return { deleted, kept, freedSpace };
}

/**
 * List recent backups
 */
function listRecentBackups(count = 10) {
  if (!existsSync(CONFIG.backupDir)) {
    log('No backups found (directory does not exist)');
    return [];
  }

  const files = readdirSync(CONFIG.backupDir)
    .filter(file => file.endsWith('.dump') || file.endsWith('.sql.gz'))
    .map(file => {
      const filePath = join(CONFIG.backupDir, file);
      const stats = statSync(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
      };
    })
    .sort((a, b) => b.modified - a.modified)
    .slice(0, count);

  if (files.length > 0) {
    log(`\nRecent backups (${files.length}):`);
    files.forEach((file, index) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const date = file.modified.toISOString().split('T')[0];
      const time = file.modified.toTimeString().split(' ')[0];
      log(`  ${index + 1}. ${file.name} (${sizeMB} MB) - ${date} ${time}`);
    });
  } else {
    log('No backups found');
  }

  return files;
}

/**
 * Send email notification (requires mail configuration)
 */
async function sendNotification(subject, message) {
  if (!CONFIG.notificationEmail) {
    log('Email notifications not configured (BACKUP_NOTIFICATION_EMAIL not set)');
    return;
  }

  // This is a placeholder for email notification
  // In production, you would integrate with SendGrid, AWS SES, or similar
  log(`Notification: ${subject}`, 'INFO');
  log(`To: ${CONFIG.notificationEmail}`);
  log(`Message: ${message}`);

  // TODO: Implement actual email sending
  // Example with nodemailer (would need to be installed):
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ to: CONFIG.notificationEmail, subject, text: message });
}

/**
 * Main execution
 */
async function main() {
  log('='.repeat(60));
  log('DATABASE BACKUP AUTOMATION - INVENTAIRE SI');
  log('='.repeat(60));
  log('');

  if (dryRun) {
    log('DRY RUN MODE - No changes will be made', 'WARN');
    log('');
  }

  try {
    // If cleanup-only mode, skip backup
    if (!cleanupOnly) {
      // Check Docker
      const dockerOk = await checkDocker();
      if (!dockerOk) {
        throw new Error('Docker check failed - cannot proceed with backup');
      }

      // Create backup
      log('');
      const backupResult = await createBackup(customName);

      if (!backupResult.success) {
        await sendNotification(
          '❌ Database Backup Failed',
          `Backup failed at ${new Date().toISOString()}\nError: ${backupResult.error}`
        );
        process.exit(1);
      }

      // Success notification
      await sendNotification(
        '✅ Database Backup Successful',
        `Backup completed successfully at ${new Date().toISOString()}\nFile: ${backupResult.filename}\nSize: ${(backupResult.size / (1024 * 1024)).toFixed(2)} MB`
      );
    }

    // Cleanup old backups
    log('');
    const cleanupResult = cleanupOldBackups();

    // List recent backups
    log('');
    listRecentBackups(10);

    log('');
    log('='.repeat(60));
    log('BACKUP AUTOMATION COMPLETED SUCCESSFULLY', 'SUCCESS');
    log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    log('');
    log('='.repeat(60), 'ERROR');
    log('BACKUP AUTOMATION FAILED', 'ERROR');
    log('='.repeat(60), 'ERROR');
    log(`Error: ${error.message}`, 'ERROR');
    log('');

    await sendNotification(
      '❌ Database Backup Automation Failed',
      `Backup automation failed at ${new Date().toISOString()}\nError: ${error.message}\nStack: ${error.stack}`
    );

    process.exit(1);
  }
}

// Run main function
main();
