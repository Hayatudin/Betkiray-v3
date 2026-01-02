-- This migration approves all existing properties that were created before the approval system was implemented
-- Run this SQL command in your database to approve all existing properties:

UPDATE "Property" 
SET "approvalStatus" = 'APPROVED' 
WHERE "approvalStatus" = 'PENDING';

-- This will set all currently pending properties to APPROVED status
-- Only run this if you want to approve all existing properties at once
