import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
let SUPABASE_URL = '';
let SUPABASE_SERVICE_KEY = '';

env.split('\n').forEach(line => {
  if (line.startsWith('SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) SUPABASE_SERVICE_KEY = line.split('=')[1].trim();
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
  console.log("Fetching users...");
  const { data, error } = await supabaseAdmin.from('users').select('email, is_admin');
  console.log(data);
}
check();
