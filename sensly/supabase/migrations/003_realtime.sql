-- Enable Supabase Realtime on companion_sessions table
-- This allows the "Going With Me" companion mode to receive live dB updates
-- Run this in Supabase SQL Editor

alter publication supabase_realtime add table companion_sessions;
