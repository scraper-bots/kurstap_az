/*
  Warnings:

  - You are about to drop the column `clerkId` on the `users` table. All the data in the column will be lost.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- DropIndex
DROP INDEX "public"."users_clerkId_key";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "clerkId",
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordTokenExpires" TIMESTAMP(3),
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionId_key" ON "public"."user_sessions"("sessionId");

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
