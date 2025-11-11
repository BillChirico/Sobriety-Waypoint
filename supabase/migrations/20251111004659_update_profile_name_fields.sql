/*
  # Update Profile Name Fields

  1. Changes
    - Rename `full_name` column to `first_name`
    - Add new `last_initial` column
    - Update existing data to split full_name into first_name and last_initial
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add the new last_initial column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_initial'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_initial text;
  END IF;
END $$;

-- Update existing records to extract last initial from full_name
UPDATE profiles 
SET last_initial = UPPER(SUBSTRING(TRIM(SPLIT_PART(full_name, ' ', 2)), 1, 1))
WHERE last_initial IS NULL AND full_name IS NOT NULL;

-- Rename full_name to first_name (if not already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN full_name TO first_name;
  END IF;
END $$;

-- Update first_name to contain only the first name
UPDATE profiles 
SET first_name = TRIM(SPLIT_PART(first_name, ' ', 1))
WHERE first_name LIKE '% %';

-- Make last_initial NOT NULL with a default value
ALTER TABLE profiles ALTER COLUMN last_initial SET DEFAULT '';
UPDATE profiles SET last_initial = '' WHERE last_initial IS NULL;
ALTER TABLE profiles ALTER COLUMN last_initial SET NOT NULL;