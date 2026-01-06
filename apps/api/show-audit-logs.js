/**
 * Script pour afficher les logs d'audit
 */

import prisma from './src/config/database.js';
import { getAuditLogs, getUserAuditLogs, getRecentAuditLogs } from './src/utils/auditLog.js';

async function showAuditLogs() {
  console.log('\n📊 AUDIT TRAIL - Logs d\'Audit\n');
  console.log('═'.repeat(80) + '\n');

  try {
    // Récupérer tous les logs récents
    const recentLogs = await getRecentAuditLogs(10);

    if (recentLogs.length === 0) {
      console.log('ℹ️  Aucun log d\'audit trouvé\n');
      return;
    }

    console.log(`📋 ${recentLogs.length} logs d'audit récents:\n`);

    recentLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} - ${log.tableName}`);
      console.log(`   📌 Record ID: ${log.recordId}`);
      console.log(`   👤 Par: ${log.user.email} (${log.user.role})`);
      console.log(`   📅 Date: ${new Date(log.createdAt).toLocaleString('fr-FR')}`);

      if (log.ipAddress) {
        console.log(`   🌐 IP: ${log.ipAddress}`);
      }

      if (log.action === 'UPDATE' && log.oldValues && log.newValues) {
        console.log('   📝 Modifications:');
        const changes = [];
        Object.keys(log.newValues).forEach(key => {
          if (JSON.stringify(log.oldValues[key]) !== JSON.stringify(log.newValues[key])) {
            changes.push(`      • ${key}: ${JSON.stringify(log.oldValues[key])} → ${JSON.stringify(log.newValues[key])}`);
          }
        });
        if (changes.length > 0) {
          changes.forEach(change => console.log(change));
        }
      }

      if (log.action === 'CREATE' && log.newValues) {
        console.log('   ✨ Nouvelles valeurs:');
        Object.keys(log.newValues).slice(0, 3).forEach(key => {
          console.log(`      • ${key}: ${JSON.stringify(log.newValues[key])}`);
        });
      }

      console.log('   ' + '─'.repeat(76));
      console.log('');
    });

    // Statistiques
    console.log('\n📊 Statistiques:');
    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        action: true
      }
    });

    stats.forEach(stat => {
      console.log(`   • ${stat.action}: ${stat._count.action} opération(s)`);
    });

    const userStats = await prisma.auditLog.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      }
    });

    console.log(`\n   📈 Total: ${recentLogs.length} logs par ${userStats.length} utilisateur(s)`);

    // Logs par table
    console.log('\n📊 Logs par table:');
    const tableStats = await prisma.auditLog.groupBy({
      by: ['tableName'],
      _count: {
        tableName: true
      }
    });

    tableStats.forEach(stat => {
      console.log(`   • ${stat.tableName}: ${stat._count.tableName} modification(s)`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Consultation terminée\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter
showAuditLogs();
