/*
  Warnings:

  - You are about to drop the column `name` on the `StockItem` table. All the data in the column will be lost.
  - Added the required column `assetModelId` to the `StockItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockItem" DROP COLUMN "name",
ADD COLUMN     "assetModelId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_assetModelId_fkey" FOREIGN KEY ("assetModelId") REFERENCES "AssetModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
