import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', 'client', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceAdmin() {
  const email = 'admin@gmail.com';
  const password = 'admin123';

  console.log(`Logging in as ${email}...`);

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw authError;
    }

    const userId = authData.user.id;
    console.log(`Logged in successfully. User ID: ${userId}`);

    console.log("Upserting profile with is_admin = true...");
    
    // We are authenticated as the user now, so RLS will allow us to insert/update our own row
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        uid: userId,
        email: email,
        parentEmail: email,
        displayName: 'Super Admin',
        age: 30,
        avatar: '🚀',
        preferredLanguage: 'en',
        profileComplete: true,
        is_admin: true // We hope RLS allows setting this!
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log("✅ Successfully forced admin profile!", data);

  } catch (err) {
    console.error("Error:", err);
  }
}

forceAdmin();
