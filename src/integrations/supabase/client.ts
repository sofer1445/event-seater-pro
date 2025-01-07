import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tzqmiadrwojsfdbhaaoz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cW1pYWRyd29qc2ZkYmhhYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MzI0NzcsImV4cCI6MjAyNTQwODQ3N30.RqOyoXZGh3TkQkf4TGdDxQwFtGP1_qXGE6_dQZvNcbY';

if (!supabaseUrl) {
  throw new Error('Supabase URL is not configured');
}

if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is not configured');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);