#!/usr/bin/env node
/**
 * @fileoverview Backup monitoring service for Inventaire SI
 *
 * Provides HTTP health endpoint to monitor backup status:
 * - Checks if recent backups exist
 * - Verifies backup file sizes are reasonable
 * - Provides metrics for monitoring systems (Prometheus, etc.)
 *
 * Usage:
 *   node scripts/backup-monitor.js
 *
 * Environment Variables:
 *   BACKUP_DIR - Directory containing backups (default: backups/database)
 *   BACKUP_MAX_AGE_HOURS - Maximum age of latest backup in hours (default: 26)
 *   HEALTHCHECK_PORT - HTTP port for health endpoint (default: 8080)
 *   BACKUP_MIN_SIZE_MB - Minimum acceptable backup size in MB (default: 0.1)
 */

import { createServer } from 'http';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// Configuration
const CONFIG = {
  backupDir: process.env.BACKUP_DIR || join(PROJECT_ROOT, 'backups', 'database'),
  maxAgeHours: parseInt(process.env.BACKUP_MAX_AGE_HOURS || '26', 10),
  minSizeMB: parseFloat(process.env.BACKUP_MIN_SIZE_MB || '0.1'),
  port: parseInt(process.env.HEALTHCHECK_PORT || '8080', 10),
};

/**
 * Get backup statistics
 */
function getBackupStats() {
  if (!existsSync(CONFIG.backupDir)) {
    return {
      healthy: false,
      error: 'Backup directory does not exist',
      totalBackups: 0,
      latestBackup: null,
    };
  }

  const files = readdirSync(CONFIG.backupDir)
    .filter(file => file.endsWith('.dump') || file.endsWith('.sql.gz'))
    .map(file => {
      const filePath = join(CONFIG.backupDir, file);
      const stats = statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        sizeMB: stats.size / (1024 * 1024),
        modified: stats.mtime,
        age: Date.now() - stats.mtime.getTime(),
      };
    })
    .sort((a, b) => b.modified - a.modified);

  if (files.length === 0) {
    return {
      healthy: false,
      error: 'No backups found',
      totalBackups: 0,
      latestBackup: null,
    };
  }

  const latest = files[0];
  const ageHours = latest.age / (1000 * 60 * 60);
  const isTooOld = ageHours > CONFIG.maxAgeHours;
  const isTooSmall = latest.sizeMB < CONFIG.minSizeMB;

  const errors = [];
  if (isTooOld) {
    errors.push(`Latest backup is ${ageHours.toFixed(1)} hours old (max: ${CONFIG.maxAgeHours})`);
  }
  if (isTooSmall) {
    errors.push(`Latest backup is only ${latest.sizeMB.toFixed(2)} MB (min: ${CONFIG.minSizeMB})`);
  }

  return {
    healthy: errors.length === 0,
    error: errors.length > 0 ? errors.join(', ') : null,
    totalBackups: files.length,
    latestBackup: {
      name: latest.name,
      sizeMB: latest.sizeMB.toFixed(2),
      ageHours: ageHours.toFixed(1),
      timestamp: latest.modified.toISOString(),
    },
    recentBackups: files.slice(0, 5).map(f => ({
      name: f.name,
      sizeMB: f.sizeMB.toFixed(2),
      timestamp: f.modified.toISOString(),
    })),
  };
}

/**
 * HTTP request handler
 */
function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    switch (url.pathname) {
      case '/health':
      case '/':
        // Health endpoint - returns 200 if healthy, 503 if unhealthy
        const stats = getBackupStats();
        const statusCode = stats.healthy ? 200 : 503;

        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: stats.healthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          ...stats,
        }, null, 2));
        break;

      case '/metrics':
        // Prometheus-compatible metrics
        const metricsStats = getBackupStats();
        const metrics = [];

        metrics.push('# HELP backup_total Total number of backups');
        metrics.push('# TYPE backup_total gauge');
        metrics.push(`backup_total ${metricsStats.totalBackups}`);

        metrics.push('# HELP backup_healthy Backup health status (1=healthy, 0=unhealthy)');
        metrics.push('# TYPE backup_healthy gauge');
        metrics.push(`backup_healthy ${metricsStats.healthy ? 1 : 0}`);

        if (metricsStats.latestBackup) {
          metrics.push('# HELP backup_latest_age_hours Age of latest backup in hours');
          metrics.push('# TYPE backup_latest_age_hours gauge');
          metrics.push(`backup_latest_age_hours ${metricsStats.latestBackup.ageHours}`);

          metrics.push('# HELP backup_latest_size_mb Size of latest backup in MB');
          metrics.push('# TYPE backup_latest_size_mb gauge');
          metrics.push(`backup_latest_size_mb ${metricsStats.latestBackup.sizeMB}`);
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(metrics.join('\n') + '\n');
        break;

      case '/status':
        // Detailed status page (HTML)
        const statusStats = getBackupStats();
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Backup Monitor - Inventaire SI</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    .status { padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .healthy { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
    .unhealthy { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
    .timestamp { color: #6c757d; font-size: 0.9em; }
  </style>
  <meta http-equiv="refresh" content="60">
</head>
<body>
  <h1>🗄️ Database Backup Monitor</h1>
  <p class="timestamp">Last updated: ${new Date().toISOString()}</p>

  <div class="status ${statusStats.healthy ? 'healthy' : 'unhealthy'}">
    <h2>${statusStats.healthy ? '✅ Backups Healthy' : '❌ Backups Unhealthy'}</h2>
    ${statusStats.error ? `<p><strong>Error:</strong> ${statusStats.error}</p>` : ''}
    <p><strong>Total Backups:</strong> ${statusStats.totalBackups}</p>
    ${statusStats.latestBackup ? `
      <p><strong>Latest Backup:</strong> ${statusStats.latestBackup.name}</p>
      <p><strong>Size:</strong> ${statusStats.latestBackup.sizeMB} MB</p>
      <p><strong>Age:</strong> ${statusStats.latestBackup.ageHours} hours</p>
      <p><strong>Created:</strong> ${new Date(statusStats.latestBackup.timestamp).toLocaleString()}</p>
    ` : '<p>No backups found</p>'}
  </div>

  ${statusStats.recentBackups && statusStats.recentBackups.length > 0 ? `
    <h2>Recent Backups</h2>
    <table>
      <thead>
        <tr>
          <th>Filename</th>
          <th>Size (MB)</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        ${statusStats.recentBackups.map(backup => `
          <tr>
            <td>${backup.name}</td>
            <td>${backup.sizeMB}</td>
            <td>${new Date(backup.timestamp).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <h2>Configuration</h2>
  <table>
    <tr><td>Backup Directory</td><td>${CONFIG.backupDir}</td></tr>
    <tr><td>Max Age (hours)</td><td>${CONFIG.maxAgeHours}</td></tr>
    <tr><td>Min Size (MB)</td><td>${CONFIG.minSizeMB}</td></tr>
  </table>

  <p style="margin-top: 40px; color: #6c757d; font-size: 0.9em;">
    <strong>Endpoints:</strong>
    <a href="/">/health</a> |
    <a href="/metrics">/metrics</a> |
    <a href="/status">/status</a>
  </p>
</body>
</html>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        break;

      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }));
  }
}

/**
 * Start the server
 */
function startServer() {
  const server = createServer(handleRequest);

  server.listen(CONFIG.port, () => {
    console.log(`🗄️  Backup Monitor Service`);
    console.log(`=`.repeat(50));
    console.log(`Status: Running`);
    console.log(`Port: ${CONFIG.port}`);
    console.log(`Backup Directory: ${CONFIG.backupDir}`);
    console.log(`Max Age: ${CONFIG.maxAgeHours} hours`);
    console.log(`Min Size: ${CONFIG.minSizeMB} MB`);
    console.log(`=`.repeat(50));
    console.log('');
    console.log('Endpoints:');
    console.log(`  Health Check:  http://localhost:${CONFIG.port}/health`);
    console.log(`  Metrics:       http://localhost:${CONFIG.port}/metrics`);
    console.log(`  Status Page:   http://localhost:${CONFIG.port}/status`);
    console.log('');

    // Log initial status
    const stats = getBackupStats();
    console.log('Initial Status:', stats.healthy ? '✅ Healthy' : '❌ Unhealthy');
    if (stats.error) {
      console.log('Error:', stats.error);
    }
    if (stats.latestBackup) {
      console.log(`Latest Backup: ${stats.latestBackup.name} (${stats.latestBackup.ageHours}h old)`);
    }
    console.log('');
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer();
