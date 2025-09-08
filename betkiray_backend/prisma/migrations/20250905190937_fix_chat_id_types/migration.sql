/*
  Warnings:

  - The primary key for the `Chat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `Chat` table. All the data in the column will be lost.
  - The primary key for the `ChatParticipant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `chat_id` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `chat_id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `sender_id` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `area_sqm` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `billing_period` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `include_utilities` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `is_furnished` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `is_negotiable` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `property_type` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `view_count` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `media_type` on the `PropertyMedia` table. All the data in the column will be lost.
  - You are about to drop the column `media_url` on the `PropertyMedia` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `PropertyMedia` table. All the data in the column will be lost.
  - You are about to drop the column `sort_order` on the `PropertyMedia` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Review` table. All the data in the column will be lost.
  - The primary key for the `SavedProperty` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `SavedProperty` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `SavedProperty` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `SavedProperty` table. All the data in the column will be lost.
  - You are about to drop the column `is_banned` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,propertyId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatId` to the `ChatParticipant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ChatParticipant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `billingPeriod` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyType` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaType` to the `PropertyMedia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaUrl` to the `PropertyMedia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyId` to the `PropertyMedia` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyId` to the `SavedProperty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SavedProperty` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ChatParticipant" DROP CONSTRAINT "ChatParticipant_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatParticipant" DROP CONSTRAINT "ChatParticipant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Feedback" DROP CONSTRAINT "Feedback_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Property" DROP CONSTRAINT "Property_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyMedia" DROP CONSTRAINT "PropertyMedia_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."SavedProperty" DROP CONSTRAINT "SavedProperty_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."SavedProperty" DROP CONSTRAINT "SavedProperty_user_id_fkey";

-- DropIndex
DROP INDEX "public"."Review_user_id_property_id_key";

-- AlterTable
ALTER TABLE "public"."Chat" DROP CONSTRAINT "Chat_pkey",
DROP COLUMN "created_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Chat_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Chat_id_seq";

-- AlterTable
ALTER TABLE "public"."ChatParticipant" DROP CONSTRAINT "ChatParticipant_pkey",
DROP COLUMN "chat_id",
DROP COLUMN "user_id",
ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("chatId", "userId");

-- AlterTable
ALTER TABLE "public"."Feedback" DROP COLUMN "created_at",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "chat_id",
DROP COLUMN "created_at",
DROP COLUMN "sender_id",
ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "senderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Property" DROP COLUMN "area_sqm",
DROP COLUMN "billing_period",
DROP COLUMN "created_at",
DROP COLUMN "include_utilities",
DROP COLUMN "is_furnished",
DROP COLUMN "is_negotiable",
DROP COLUMN "owner_id",
DROP COLUMN "property_type",
DROP COLUMN "view_count",
ADD COLUMN     "areaSqm" INTEGER,
ADD COLUMN     "billingPeriod" "public"."BillingPeriod" NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "includeUtilities" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFurnished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNegotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "propertyType" "public"."PropertyType" NOT NULL,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."PropertyMedia" DROP COLUMN "media_type",
DROP COLUMN "media_url",
DROP COLUMN "property_id",
DROP COLUMN "sort_order",
ADD COLUMN     "mediaType" "public"."MediaType" NOT NULL,
ADD COLUMN     "mediaUrl" TEXT NOT NULL,
ADD COLUMN     "propertyId" INTEGER NOT NULL,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Review" DROP COLUMN "created_at",
DROP COLUMN "property_id",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "propertyId" INTEGER NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."SavedProperty" DROP CONSTRAINT "SavedProperty_pkey",
DROP COLUMN "created_at",
DROP COLUMN "property_id",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "propertyId" INTEGER NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "SavedProperty_pkey" PRIMARY KEY ("userId", "propertyId");

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "is_banned",
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_propertyId_key" ON "public"."Review"("userId", "propertyId");

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedProperty" ADD CONSTRAINT "SavedProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedProperty" ADD CONSTRAINT "SavedProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
