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
  console.log("Fetching from reviews...");
  const { data, error } = await supabaseAdmin.from('reviews').select('*');
  if (error) {
    console.error("Fetch Error:", error);
  } else {
    console.log("Reviews found:", data.length);
    console.log(data);
  }
}
check();
