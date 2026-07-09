import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', 'client', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'admin@gmail.com';
  const password = 'admin123';

  console.log(`Creating user: ${email}...`);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`User ${email} already exists.`);
      } else {
        throw error;
      }
    } else {
      console.log(`User created successfully. ID: ${data.user.id}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

createAdmin();
