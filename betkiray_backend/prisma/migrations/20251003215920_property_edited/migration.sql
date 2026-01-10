/*
  Warnings:

  - Added the required column `phone` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "subCity" TEXT;
