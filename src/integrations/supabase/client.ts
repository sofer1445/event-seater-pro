import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tzqmiadrwojsfdbhaaoz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cW1pYWRyd29qc2ZkYmhhYW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3MzY0ODAsImV4cCI6MjAyNTMxMjQ4MH0.vxjjXPxDtMgQf-yCU6u36H9V_qHu8cMdHwQQYyTUeLw'

if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not properly configured. Please set it in your .env file with your actual Supabase project URL')
if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY is not properly configured. Please set it in your .env file with your actual Supabase anon key')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)