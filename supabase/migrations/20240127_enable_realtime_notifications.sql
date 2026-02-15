-- Enable Realtime for notifications table
-- This ensures that both INSERT, UPDATE and DELETE events are broadcasted
-- Note: Requires the project to have Realtime enabled in Supabase dashboard settings as well.

BEGIN;

-- Check if publication exists, if not create it (standard supabase setup usually has it)
-- Typically 'supabase_realtime' is the default publication.

-- Add notifications table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

COMMIT;
