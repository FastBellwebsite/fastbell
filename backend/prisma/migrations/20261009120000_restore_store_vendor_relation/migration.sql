ALTER TABLE `store`
ADD CONSTRAINT `Store_vendorId_fkey`
FOREIGN KEY (`vendorId`)
REFERENCES `vendorprofile` (`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;