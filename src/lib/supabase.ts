
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xtudprllozcopekqjihe.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWRwcmxsb3pjb3Bla3FqaWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTU3NzYsImV4cCI6MjA2NTc3MTc3Nn0.BmHsam-qSWbkNcypXGQciwxrsIpyMlDCphsWB_TUiNQ";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_MEDIA_BUCKET = 'media-files'; // Define your bucket name here

