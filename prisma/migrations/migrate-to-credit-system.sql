-- Migration to simplify credit-based system
-- This migration converts existing plan-based users to credit-based

-- Step 1: Convert existing users to credit system
-- BASIC users → 1 credit
-- STANDARD users → 5 credits  
-- PREMIUM users → 10 credits
-- FREE users → 0 credits

UPDATE users 
SET 
    "interviewCredits" = CASE 
        WHEN "planType" = 'BASIC' AND "interviewCredits" = 0 THEN 1
        WHEN "planType" = 'STANDARD' AND "interviewCredits" = 0 THEN 5
        WHEN "planType" = 'PREMIUM' AND "interviewCredits" = 0 THEN 10
        ELSE "interviewCredits"
    END,
    "planType" = 'FREE'
WHERE "interviewCredits" = 0;

-- Step 2: Add comment to document the new system
COMMENT ON COLUMN users."interviewCredits" IS 'Number of interview sessions the user can take. Each interview consumes 1 credit.';
COMMENT ON COLUMN users."planType" IS 'Legacy field kept for compatibility. All users are now FREE with credit-based access.';