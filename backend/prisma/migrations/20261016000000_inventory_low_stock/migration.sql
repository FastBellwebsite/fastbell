-- AlterTable
ALTER TABLE `product`
  ADD COLUMN `lowStockThreshold` INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN `trackInventory` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `Product_trackInventory_idx` ON `product`(`trackInventory`);

-- AlterTable
ALTER TABLE `order`
  ADD COLUMN `stockRestored` BOOLEAN NOT NULL DEFAULT false;

-- Disable inventory tracking for service products (Laundry)
UPDATE `product` SET `trackInventory` = false WHERE `categoryId` = 'cat-laundry';
