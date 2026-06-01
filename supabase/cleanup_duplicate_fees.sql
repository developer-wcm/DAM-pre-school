-- Delete all existing fees
DELETE FROM fees;

-- Verify deletion
SELECT COUNT(*) as remaining_fees FROM fees;