/*
  # Create User Step Progress Table

  1. New Tables
    - `user_step_progress`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - References profiles.id
      - `step_number` (integer) - The step number (1-12)
      - `completed` (boolean) - Whether the step is marked complete
      - `completed_at` (timestamptz) - When the step was marked complete
      - `notes` (text, optional) - User's personal notes about completing this step
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Indexes
    - Unique index on (user_id, step_number) to prevent duplicate progress entries
    - Index on user_id for fast lookups

  3. Security
    - Enable RLS on `user_step_progress` table
    - Users can view their own progress
    - Users can insert their own progress
    - Users can update their own progress
    - Users can delete their own progress
    - Sponsors can view their sponsees' progress (read-only)

  4. Constraints
    - step_number must be between 1 and 12
    - completed defaults to true
    - completed_at defaults to current timestamp when completed is true
*/

-- Create the user_step_progress table
CREATE TABLE IF NOT EXISTS user_step_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_number integer NOT NULL CHECK (step_number >= 1 AND step_number <= 12),
  completed boolean NOT NULL DEFAULT true,
  completed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, step_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_step_progress_user_id ON user_step_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_step_progress_step_number ON user_step_progress(step_number);

-- Enable RLS
ALTER TABLE user_step_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own step progress
CREATE POLICY "Users can view own step progress"
  ON user_step_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Sponsors can view their sponsees' step progress
CREATE POLICY "Sponsors can view sponsees' step progress"
  ON user_step_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sponsor_sponsee_relationships
      WHERE sponsor_sponsee_relationships.sponsor_id = auth.uid()
        AND sponsor_sponsee_relationships.sponsee_id = user_step_progress.user_id
        AND sponsor_sponsee_relationships.status = 'active'
    )
  );

-- Users can insert their own step progress
CREATE POLICY "Users can insert own step progress"
  ON user_step_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own step progress
CREATE POLICY "Users can update own step progress"
  ON user_step_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own step progress
CREATE POLICY "Users can delete own step progress"
  ON user_step_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_step_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_user_step_progress_updated_at ON user_step_progress;
CREATE TRIGGER trigger_update_user_step_progress_updated_at
  BEFORE UPDATE ON user_step_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_step_progress_updated_at();
