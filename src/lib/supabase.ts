import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug information
console.log('Environment Variables Status:')
console.log('VITE_SUPABASE_URL:', supabaseUrl)
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey)

if (!supabaseUrl) {
    throw new Error(
        'VITE_SUPABASE_URL is not properly configured. ' +
        'Please set it in your .env file with your actual Supabase project URL'
    )
}

if (!supabaseAnonKey) {
    throw new Error(
        'VITE_SUPABASE_ANON_KEY is not properly configured. ' +
        'Please set it in your .env file with your actual Supabase anon key'
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
