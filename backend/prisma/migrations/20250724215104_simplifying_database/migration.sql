/*
  Warnings:

  - You are about to drop the column `eventVisibility` on the `UserPrivacySettings` table. All the data in the column will be lost.
  - You are about to drop the column `friendVisibility` on the `UserPrivacySettings` table. All the data in the column will be lost.
  - You are about to drop the column `profileVisibility` on the `UserPrivacySettings` table. All the data in the column will be lost.
  - You are about to drop the `BlockedUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Friend` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BlockedUser" DROP CONSTRAINT "BlockedUser_blockedUserId_fkey";

-- DropForeignKey
ALTER TABLE "BlockedUser" DROP CONSTRAINT "BlockedUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_friend_id_fkey";

-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- AlterTable
ALTER TABLE "UserPrivacySettings" DROP COLUMN "eventVisibility",
DROP COLUMN "friendVisibility",
DROP COLUMN "profileVisibility";

-- DropTable
DROP TABLE "BlockedUser";

-- DropTable
DROP TABLE "Friend";

-- DropTable
DROP TABLE "Message";
