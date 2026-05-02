-- Fix: profiles table has no INSERT policy — RLS silently blocks profile creation.
-- The existing "profiles_owner" policy only covers SELECT/UPDATE/DELETE (USING clause).
-- INSERT requires a separate WITH CHECK clause.

create policy "profiles_insert" on profiles
  for insert
  with check (auth.uid() = user_id);
