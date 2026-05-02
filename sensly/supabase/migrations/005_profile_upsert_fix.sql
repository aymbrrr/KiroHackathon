-- Fix: Add unique constraint on (user_id, is_default) so upsert works
-- The ProfileEditScreen uses onConflict: 'user_id,is_default' which requires this.
-- Also add a unique index on user_id for single-profile lookups.

create unique index if not exists profiles_user_default
  on profiles (user_id, is_default)
  where is_default = true;
