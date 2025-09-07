/*
  Warnings:

  - The `questions` column on the `interviews` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `planType` on the `payments` table. All the data in the column will be lost.
  - The `type` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `planType` on the `users` table. All the data in the column will be lost.
  - Added the required column `totalQuestions` to the `interviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."InterviewMode" AS ENUM ('QUICK_ASSESSMENT', 'STANDARD', 'COMPREHENSIVE', 'TECHNICAL_DEEP', 'BEHAVIORAL_FOCUS', 'MIXED_CHALLENGE');

-- AlterTable
ALTER TABLE "public"."interviews" ADD COLUMN     "audioTranscript" TEXT,
ADD COLUMN     "mode" "public"."InterviewMode" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "totalQuestions" INTEGER NOT NULL,
ADD COLUMN     "videoAnalysis" JSONB,
ADD COLUMN     "videoUrl" TEXT,
DROP COLUMN "questions",
ADD COLUMN     "questions" JSONB[];

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "planType",
ADD COLUMN     "formHtml" TEXT;

-- AlterTable
ALTER TABLE "public"."sessions" ADD COLUMN     "bodyLanguage" JSONB,
ADD COLUMN     "eyeContact" JSONB,
ADD COLUMN     "facialMetrics" JSONB,
ADD COLUMN     "speechPacing" JSONB,
ADD COLUMN     "videoAnalysis" JSONB,
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."subscriptions" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'CREDIT_BASED';

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "planType",
ADD COLUMN     "interviewCredits" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "public"."SubscriptionType";
