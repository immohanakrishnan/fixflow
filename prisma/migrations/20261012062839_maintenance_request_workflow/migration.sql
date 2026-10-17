/*
  Warnings:

  - Added the required column `propertyId` to the `MaintenanceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `MaintenanceRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `agentactionlog` ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `aitriageresult` ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `attachment` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `maintenancerequest` ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    ADD COLUMN `categoryId` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `priority` ENUM('EMERGENCY', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN `propertyId` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `unitId` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notification` ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `property` ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `technicianavailability` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `technicianprofile` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `technicianskill` ADD COLUMN `categoryId` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tenantoccupancy` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `tenantId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `billingCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `billingCompletedAt` DATETIME(3) NULL,
    ADD COLUMN `billingCompletedById` VARCHAR(191) NULL,
    ADD COLUMN `categoryId` VARCHAR(191) NULL,
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedById` VARCHAR(191) NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `ticketassignment` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ticketcomment` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `unit` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `phone` VARCHAR(191) NULL,
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,

    UNIQUE INDEX `Tenant_userId_key`(`userId`),
    INDEX `Tenant_propertyId_unitId_status_idx`(`propertyId`, `unitId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_entityId_createdAt_idx`(`entity`, `entityId`, `createdAt`),
    INDEX `AuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Tenant` ADD CONSTRAINT `Tenant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tenant` ADD CONSTRAINT `Tenant_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tenant` ADD CONSTRAINT `Tenant_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantOccupancy` ADD CONSTRAINT `TenantOccupancy_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TechnicianSkill` ADD CONSTRAINT `TechnicianSkill_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceRequest` ADD CONSTRAINT `MaintenanceRequest_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceRequest` ADD CONSTRAINT `MaintenanceRequest_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceRequest` ADD CONSTRAINT `MaintenanceRequest_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
