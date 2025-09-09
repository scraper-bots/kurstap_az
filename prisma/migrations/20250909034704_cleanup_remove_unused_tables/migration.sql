/*
  Warnings:

  - You are about to drop the `interview_answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."interview_answers" DROP CONSTRAINT "interview_answers_interviewId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sessions" DROP CONSTRAINT "sessions_interviewId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscriptions" DROP CONSTRAINT "subscriptions_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscriptions" DROP CONSTRAINT "subscriptions_userId_fkey";

-- DropTable
DROP TABLE "public"."interview_answers";

-- DropTable
DROP TABLE "public"."sessions";

-- DropTable
DROP TABLE "public"."subscriptions";

-- DropEnum
DROP TYPE "public"."SessionStatus";

-- DropEnum
DROP TYPE "public"."SessionType";

-- DropEnum
DROP TYPE "public"."SubscriptionStatus";
