ALTER TABLE `User` ADD COLUMN `tokenVersion` INT NOT NULL DEFAULT 0;

CREATE TABLE `Session` (
  `id` CHAR(36) NOT NULL,
  `userId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `ipHash` TEXT NULL,
  `userAgent` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `Session_userId_idx` (`userId`),
  INDEX `Session_expiresAt_idx` (`expiresAt`)
);

CREATE TABLE `AuditEvent` (
  `id` VARCHAR(191) NOT NULL,
  `actorUserId` INT NULL,
  `action` TEXT NOT NULL,
  `target` TEXT NULL,
  `metadata` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AuditEvent_createdAt_idx` (`createdAt`)
);

