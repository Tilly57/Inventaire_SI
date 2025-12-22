-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GESTIONNAIRE', 'LECTURE');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('EN_STOCK', 'PRETE', 'HS', 'REPARATION');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GESTIONNAIRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "dept" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetModel" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetItem" (
    "id" TEXT NOT NULL,
    "assetModelId" TEXT NOT NULL,
    "assetTag" TEXT,
    "serial" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'EN_STOCK',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "pickupSignatureUrl" TEXT,
    "returnSignatureUrl" TEXT,
    "pickupSignedAt" TIMESTAMP(3),
    "returnSignedAt" TIMESTAMP(3),

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanLine" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "assetItemId" TEXT,
    "stockItemId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LoanLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AssetItem_assetTag_key" ON "AssetItem"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "AssetItem_serial_key" ON "AssetItem"("serial");

-- AddForeignKey
ALTER TABLE "AssetItem" ADD CONSTRAINT "AssetItem_assetModelId_fkey" FOREIGN KEY ("assetModelId") REFERENCES "AssetModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanLine" ADD CONSTRAINT "LoanLine_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanLine" ADD CONSTRAINT "LoanLine_assetItemId_fkey" FOREIGN KEY ("assetItemId") REFERENCES "AssetItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanLine" ADD CONSTRAINT "LoanLine_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
