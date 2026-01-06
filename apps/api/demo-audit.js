/**
 * Script de démonstration de l'Audit Trail
 * Crée des exemples de logs d'audit pour tester le système
 */

import prisma from './src/config/database.js';
import { createAuditLog } from './src/utils/auditLog.js';

async function demoAuditTrail() {
  console.log('🎯 Démonstration de l\'Audit Trail\n');

  try {
    // Récupérer un utilisateur admin existant
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.error('❌ Aucun utilisateur admin trouvé');
      return;
    }

    console.log(`✅ Utilisateur admin trouvé: ${admin.email}\n`);

    // Récupérer un employé existant
    const employee = await prisma.employee.findFirst();

    if (!employee) {
      console.error('❌ Aucun employé trouvé');
      return;
    }

    console.log(`✅ Employé trouvé: ${employee.firstName} ${employee.lastName}\n`);

    // Exemple 1: Log de CRÉATION d'employé
    console.log('📝 Création d\'un log d\'audit pour CRÉATION d\'employé...');
    await createAuditLog({
      userId: admin.id,
      action: 'CREATE',
      tableName: 'Employee',
      recordId: employee.id,
      newValues: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        dept: employee.dept
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Demo Script)'
    });
    console.log('✅ Log CREATE créé\n');

    // Exemple 2: Log de MODIFICATION d'employé
    console.log('📝 Création d\'un log d\'audit pour MODIFICATION d\'employé...');
    await createAuditLog({
      userId: admin.id,
      action: 'UPDATE',
      tableName: 'Employee',
      recordId: employee.id,
      oldValues: {
        dept: employee.dept
      },
      newValues: {
        dept: 'IT Department (Updated)'
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Demo Script)'
    });
    console.log('✅ Log UPDATE créé\n');

    // Récupérer un prêt existant
    const loan = await prisma.loan.findFirst({
      include: {
        employee: true
      }
    });

    if (loan) {
      console.log(`✅ Prêt trouvé: ID ${loan.id}\n`);

      // Exemple 3: Log de MODIFICATION de prêt
      console.log('📝 Création d\'un log d\'audit pour MODIFICATION de prêt...');
      await createAuditLog({
        userId: admin.id,
        action: 'UPDATE',
        tableName: 'Loan',
        recordId: loan.id,
        oldValues: {
          status: loan.status
        },
        newValues: {
          status: loan.status,
          pickupSignedAt: new Date()
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Demo Script)'
      });
      console.log('✅ Log UPDATE prêt créé\n');
    }

    // Récupérer tous les logs créés
    console.log('📊 Récupération de tous les logs d\'audit...\n');
    const allLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ ${allLogs.length} logs d'audit trouvés:\n`);

    allLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} - ${log.tableName} #${log.recordId.substring(0, 8)}...`);
      console.log(`   Par: ${log.user.email} (${log.user.role})`);
      console.log(`   Date: ${log.createdAt.toISOString()}`);
      console.log(`   IP: ${log.ipAddress || 'N/A'}`);
      console.log('');
    });

    // Tester la récupération des logs pour un enregistrement spécifique
    if (employee) {
      console.log(`\n📋 Logs d'audit pour l'employé ${employee.firstName} ${employee.lastName}:\n`);
      const employeeLogs = await prisma.auditLog.findMany({
        where: {
          tableName: 'Employee',
          recordId: employee.id
        },
        include: {
          user: {
            select: {
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      employeeLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} le ${log.createdAt.toLocaleString('fr-FR')}`);
        console.log(`   Par: ${log.user.email}`);
        if (log.oldValues && log.newValues) {
          console.log('   Modifications:');
          Object.keys(log.newValues).forEach(key => {
            if (log.oldValues[key] !== log.newValues[key]) {
              console.log(`     - ${key}: ${JSON.stringify(log.oldValues[key])} → ${JSON.stringify(log.newValues[key])}`);
            }
          });
        }
        console.log('');
      });
    }

    console.log('\n✅ Démonstration terminée avec succès !');
    console.log('\n📚 Pour consulter les logs via l\'API:');
    console.log('   GET /api/audit-logs');
    console.log('   GET /api/audit-logs?tableName=Employee&recordId=' + employee.id);
    console.log('   GET /api/audit-logs?userId=' + admin.id);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la démonstration
demoAuditTrail();
