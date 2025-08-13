/*
  Warnings:

  - A unique constraint covering the columns `[userId,messageId]` on the table `MessageReaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,groupMessageId]` on the table `MessageReaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "MessageReaction" DROP CONSTRAINT "MessageReaction_messageId_fkey";

-- DropIndex
DROP INDEX "MessageReaction_messageId_userId_key";

-- AlterTable
ALTER TABLE "MessageReaction" ADD COLUMN     "groupMessageId" TEXT,
ALTER COLUMN "messageId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_userId_messageId_key" ON "MessageReaction"("userId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_userId_groupMessageId_key" ON "MessageReaction"("userId", "groupMessageId");

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_groupMessageId_fkey" FOREIGN KEY ("groupMessageId") REFERENCES "GroupMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
