/*
  Warnings:

  - You are about to drop the `agentactionlog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `aitriageresult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `agentactionlog` DROP FOREIGN KEY `AgentActionLog_ticketId_fkey`;

-- DropForeignKey
ALTER TABLE `aitriageresult` DROP FOREIGN KEY `AITriageResult_ticketId_fkey`;

-- DropTable
DROP TABLE `agentactionlog`;

-- DropTable
DROP TABLE `aitriageresult`;
