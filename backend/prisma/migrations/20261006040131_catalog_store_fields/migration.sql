/*
  Warnings:

  - Added the required column `categoryId` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `store` DROP FOREIGN KEY `Store_vendorId_fkey`;

-- DropIndex
DROP INDEX `Store_vendorId_key` ON `store`;

-- AlterTable
ALTER TABLE `store` ADD COLUMN `categoryId` VARCHAR(191) NOT NULL,
    ADD COLUMN `deliveryMinutes` INTEGER NULL,
    ADD COLUMN `distanceFromCampus` INTEGER NULL,
    ADD COLUMN `locationLabel` VARCHAR(191) NULL,
    ADD COLUMN `rating` DOUBLE NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


