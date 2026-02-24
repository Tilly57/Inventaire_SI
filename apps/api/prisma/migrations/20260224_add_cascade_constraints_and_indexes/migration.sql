-- Add cascade delete constraints and missing indexes

-- AssetItem: CASCADE on delete when AssetModel is deleted
ALTER TABLE "AssetItem" DROP CONSTRAINT IF EXISTS "AssetItem_assetModelId_fkey";
ALTER TABLE "AssetItem" ADD CONSTRAINT "AssetItem_assetModelId_fkey"
  FOREIGN KEY ("assetModelId") REFERENCES "AssetModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StockItem: CASCADE on delete when AssetModel is deleted
ALTER TABLE "StockItem" DROP CONSTRAINT IF EXISTS "StockItem_assetModelId_fkey";
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_assetModelId_fkey"
  FOREIGN KEY ("assetModelId") REFERENCES "AssetModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Employee: SET NULL on manager deletion
ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_managerId_fkey";
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Loan: RESTRICT on employee/creator deletion, SET NULL on deleter
ALTER TABLE "Loan" DROP CONSTRAINT IF EXISTS "Loan_employeeId_fkey";
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Loan" DROP CONSTRAINT IF EXISTS "Loan_createdById_fkey";
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Loan" DROP CONSTRAINT IF EXISTS "Loan_deletedById_fkey";
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_deletedById_fkey"
  FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- LoanLine: CASCADE on loan deletion, SET NULL on asset/stock deletion
ALTER TABLE "LoanLine" DROP CONSTRAINT IF EXISTS "LoanLine_loanId_fkey";
ALTER TABLE "LoanLine" ADD CONSTRAINT "LoanLine_loanId_fkey"
  FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoanLine" DROP CONSTRAINT IF EXISTS "LoanLine_assetItemId_fkey";
ALTER TABLE "LoanLine" ADD CONSTRAINT "LoanLine_assetItemId_fkey"
  FOREIGN KEY ("assetItemId") REFERENCES "AssetItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LoanLine" DROP CONSTRAINT IF EXISTS "LoanLine_stockItemId_fkey";
ALTER TABLE "LoanLine" ADD CONSTRAINT "LoanLine_stockItemId_fkey"
  FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AuditLog: CASCADE on user deletion
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS "AssetItem_status_createdAt_idx" ON "AssetItem"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "StockItem_quantity_idx" ON "StockItem"("quantity");
CREATE INDEX IF NOT EXISTS "LoanLine_loanId_assetItemId_idx" ON "LoanLine"("loanId", "assetItemId");
CREATE INDEX IF NOT EXISTS "LoanLine_loanId_stockItemId_idx" ON "LoanLine"("loanId", "stockItemId");
