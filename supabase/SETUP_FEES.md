# Fee Setup Guide

## Step 1: Clean Up Duplicates
Run in Supabase SQL Editor:
```sql
DELETE FROM fees;
```

## Step 2: Create Installments
Run `fee_structure_config.sql` in Supabase SQL Editor

This will create:
- Monthly plan (12 installments) for all students
- Quarterly plan (4 installments) for all students
- Different amounts per class:
  - PG: ₹60,000
  - PKG: ₹65,000
  - JKG: ₹70,000
  - SKG: ₹75,000

## Step 3: View in App
- Open student profile
- Go to Fees tab
- Toggle between "Monthly (12)" and "Quarterly (4)"
- Each plan shows separately now!
