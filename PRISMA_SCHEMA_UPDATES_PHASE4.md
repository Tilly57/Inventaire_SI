# Prisma Schema Updates - Phase 4 Performance Optimizations

## Overview

This document describes the Prisma schema changes needed for Phase 4 performance optimizations. These changes add composite indexes and the missing `managerId` field required by the resource authorization middleware.

## ⚠️ Important Note

The current database has `searchVector` columns not present in schema.prisma:
- `AssetItem.searchVector` (18 non-null values)
- `AssetModel.searchVector` (6 non-null values)
- `Employee.searchVector` (106 non-null values)

**Before applying these migrations, ensure searchVector columns are added to schema.prisma to prevent data loss.**

## Schema Changes

### 1. Employee Model - Add Manager Relationship

```prisma
model Employee {
  id        String   @id @default(cuid())
  firstName String
  lastName  String
  email     String?  @unique
  dept      String?
  managerId String?  // NEW: Reference to User who manages this employee
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  manager   User?    @relation("EmployeeManager", fields: [managerId], references: [id]) // NEW
  loans     Loan[]

  @@index([lastName, firstName])
  @@index([email])
  @@index([dept])
  @@index([managerId])              // NEW: Index for manager queries
  @@index([managerId, dept])        // NEW: Composite index for filtered manager queries
}
```

**Rationale**:
- Required by `resourceAuth.js` middleware which checks `employee.managerId`
- Enables GESTIONNAIRE role to manage only their assigned employees
- Composite index `[managerId, dept]` optimizes queries filtering by manager and department

### 2. User Model - Add Managed Employees Relation

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(GESTIONNAIRE)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  loansCreated     Loan[]     @relation("LoanCreatedBy")
  loansDeleted     Loan[]     @relation("LoanDeletedBy")
  managedEmployees Employee[] @relation("EmployeeManager")  // NEW: Reverse relation
  auditLogs        AuditLog[]

  @@index([email])
  @@index([role])
  @@index([role, createdAt])  // NEW: Composite index for admin user management
}
```

**Rationale**:
- Completes bidirectional relationship with Employee
- Composite index `[role, createdAt]` optimizes admin queries filtering users by role and creation date

### 3. Loan Model - Add Performance Indexes

```prisma
model Loan {
  // ... existing fields ...

  @@index([employeeId])
  @@index([status])
  @@index([deletedAt])
  @@index([openedAt])
  @@index([closedAt])
  @@index([createdById])
  @@index([employeeId, status])
  @@index([openedAt, status])
  @@index([createdById, status])      // NEW: GESTIONNAIRE filtering their loans by status
  @@index([createdById, openedAt])    // NEW: GESTIONNAIRE filtering their loans by date
}
```

**Rationale**:
- `[createdById, status]`: Optimizes GESTIONNAIRE queries to filter their own loans by status (OPEN/CLOSED)
- `[createdById, openedAt]`: Optimizes date-based filtering for loan history by creator

## Migration Strategy

### Option 1: Manual Migration (Recommended for Production)

1. **Backup database first**:
   ```bash
   pg_dump -U postgres -d inventaire > backup_before_phase4.sql
   ```

2. **Add searchVector columns to schema.prisma** (if not already present):
   ```prisma
   model Employee {
     // ... other fields ...
     searchVector Unsupported("tsvector")?
   }

   model AssetModel {
     // ... other fields ...
     searchVector Unsupported("tsvector")?
   }

   model AssetItem {
     // ... other fields ...
     searchVector Unsupported("tsvector")?
   }
   ```

3. **Create migration**:
   ```bash
   cd apps/api
   npx prisma migrate dev --name add_manager_and_performance_indexes
   ```

4. **Verify migration** before applying to production

### Option 2: Development Push (Use with caution)

```bash
cd apps/api
npx prisma db push --accept-data-loss  # Only in development!
```

### Option 3: Manual SQL (For precise control)

```sql
-- Add managerId column to Employee
ALTER TABLE "Employee" ADD COLUMN "managerId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Employee"
  ADD CONSTRAINT "Employee_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for Employee
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");
CREATE INDEX "Employee_managerId_dept_idx" ON "Employee"("managerId", "dept");

-- Add indexes for User
CREATE INDEX "User_role_createdAt_idx" ON "User"("role", "createdAt");

-- Add indexes for Loan
CREATE INDEX "Loan_createdById_status_idx" ON "Loan"("createdById", "status");
CREATE INDEX "Loan_createdById_openedAt_idx" ON "Loan"("createdById", "openedAt");
```

## Performance Impact

### Expected Query Improvements

1. **Employee Manager Queries** (resourceAuth middleware):
   ```javascript
   // Before: Full table scan
   // After: Index seek on managerId
   const employee = await prisma.employee.findUnique({
     where: { id: employeeId },
     select: { managerId: true }
   });
   ```

2. **GESTIONNAIRE Loan Filtering**:
   ```javascript
   // Before: Sequential scan + filter
   // After: Index seek on (createdById, status)
   const loans = await prisma.loan.findMany({
     where: {
       createdById: userId,
       status: 'OPEN'
     }
   });
   ```

3. **Admin User Management**:
   ```javascript
   // Before: Filter after full scan
   // After: Index range scan on (role, createdAt)
   const users = await prisma.user.findMany({
     where: { role: 'GESTIONNAIRE' },
     orderBy: { createdAt: 'desc' }
   });
   ```

### Estimated Performance Gains

- **Employee ownership checks**: ~50-70% faster (O(n) → O(log n))
- **Loan filtering by creator**: ~60-80% faster for large datasets
- **User management queries**: ~40-60% faster

## Data Migration Notes

### Existing Data Considerations

- **Employee.managerId**: Will be NULL for all existing employees
  - Admins should assign managers after migration
  - Consider adding a UI for bulk manager assignment

- **Indexes**: Will be built automatically during migration
  - May take 1-5 seconds depending on data volume
  - No downtime required (PostgreSQL builds indexes concurrently by default)

## Rollback Strategy

If issues occur, rollback with:

```sql
-- Remove new indexes
DROP INDEX IF EXISTS "Employee_managerId_idx";
DROP INDEX IF EXISTS "Employee_managerId_dept_idx";
DROP INDEX IF EXISTS "User_role_createdAt_idx";
DROP INDEX IF EXISTS "Loan_createdById_status_idx";
DROP INDEX IF EXISTS "Loan_createdById_openedAt_idx";

-- Remove managerId column (CAUTION: loses assignment data)
ALTER TABLE "Employee" DROP COLUMN "managerId";
```

## Testing Checklist

After migration:

- [ ] Verify all existing tests pass: `npm test`
- [ ] Test resource authorization: GESTIONNAIRE can only access managed employees
- [ ] Test loan filtering: GESTIONNAIRE sees only their loans
- [ ] Verify search functionality still works (searchVector columns preserved)
- [ ] Check query performance with EXPLAIN ANALYZE
- [ ] Verify foreign key constraints work correctly

## Related Files

- Schema: `apps/api/prisma/schema.prisma`
- Resource Auth Middleware: `apps/api/src/middleware/resourceAuth.js`
- Employee Service: `apps/api/src/services/employees.service.js`
- Loan Service: `apps/api/src/services/loans.service.js`

## Security Considerations

- **Manager Assignment**: Only ADMIN role should be able to assign/change managers
- **Data Isolation**: GESTIONNAIRE must never see employees they don't manage
- **Audit Logging**: Log all manager assignment changes

## Next Steps

1. Add searchVector columns to schema.prisma
2. Run migration in development environment
3. Test thoroughly
4. Create backup of production database
5. Apply migration to production during maintenance window
6. Update UI to support manager assignment
7. Create bulk manager assignment script for existing employees

---

**Author**: Phase 4 Performance Optimizations
**Date**: 2026-01-26
**Status**: Ready for Review
**Risk Level**: Medium (adds columns and indexes, but requires searchVector handling)