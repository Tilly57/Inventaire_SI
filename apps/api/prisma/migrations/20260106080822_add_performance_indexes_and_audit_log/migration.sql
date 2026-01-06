-- AlterTable
ALTER TABLE "Loan" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_tableName_recordId_idx" ON "AuditLog"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AssetItem_assetModelId_idx" ON "AssetItem"("assetModelId");

-- CreateIndex
CREATE INDEX "AssetItem_status_idx" ON "AssetItem"("status");

-- CreateIndex
CREATE INDEX "AssetItem_assetModelId_status_idx" ON "AssetItem"("assetModelId", "status");

-- CreateIndex
CREATE INDEX "Employee_lastName_firstName_idx" ON "Employee"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Loan_employeeId_idx" ON "Loan"("employeeId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_deletedAt_idx" ON "Loan"("deletedAt");

-- CreateIndex
CREATE INDEX "Loan_openedAt_idx" ON "Loan"("openedAt");

-- CreateIndex
CREATE INDEX "Loan_employeeId_status_idx" ON "Loan"("employeeId", "status");

-- CreateIndex
CREATE INDEX "Loan_createdById_idx" ON "Loan"("createdById");

-- CreateIndex
CREATE INDEX "LoanLine_loanId_idx" ON "LoanLine"("loanId");

-- CreateIndex
CREATE INDEX "LoanLine_assetItemId_idx" ON "LoanLine"("assetItemId");

-- CreateIndex
CREATE INDEX "LoanLine_stockItemId_idx" ON "LoanLine"("stockItemId");

-- CreateIndex
CREATE INDEX "StockItem_assetModelId_idx" ON "StockItem"("assetModelId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
