-- CreateIndex
CREATE INDEX "AssetModel_type_idx" ON "AssetModel"("type");

-- CreateIndex
CREATE INDEX "AssetModel_brand_idx" ON "AssetModel"("brand");

-- CreateIndex
CREATE INDEX "AssetModel_type_brand_idx" ON "AssetModel"("type", "brand");

-- CreateIndex
CREATE INDEX "Employee_dept_idx" ON "Employee"("dept");

-- CreateIndex
CREATE INDEX "Loan_closedAt_idx" ON "Loan"("closedAt");

-- CreateIndex
CREATE INDEX "Loan_openedAt_status_idx" ON "Loan"("openedAt", "status");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_tableName_action_idx" ON "AuditLog"("tableName", "action");
