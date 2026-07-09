import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn("WARNING: SUPABASE_URL is missing. Admin routes will fail.");
}

export const supabaseAdmin = createClient(supabaseUrl || 'http://localhost:54321', supabaseServiceKey || supabaseAnonKey || 'dummy', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
