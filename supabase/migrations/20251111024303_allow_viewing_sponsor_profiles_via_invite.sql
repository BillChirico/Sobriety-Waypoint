/*
  # Allow Viewing Sponsor Profiles via Valid Invite Codes

  1. Changes
    - Add SELECT policy allowing users to view profiles of sponsors who have valid, unused invite codes
    - This enables the invite code flow where a sponsee can see the sponsor's name before connecting
  
  2. Security
    - Only allows viewing profiles for sponsors with active, valid invite codes
    - Maintains privacy by requiring a valid invite code to exist
*/

-- Add policy to allow viewing sponsor profiles if they have valid invite codes
CREATE POLICY "Users can view profiles with valid invite codes"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM invite_codes 
      WHERE invite_codes.sponsor_id = profiles.id
        AND invite_codes.expires_at > NOW()
        AND invite_codes.used_by IS NULL
    )
  );
