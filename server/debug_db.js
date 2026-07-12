import { config } from 'dotenv';
config();
import { supabaseAdmin } from './supabaseClient.js';

async function check() {
  console.log("Testing update...");
  const { error } = await supabaseAdmin.from('users').update({ 
    xp: 100, 
    streak: 1 
  }).eq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error("UPDATE ERROR:", error);
  } else {
    console.log("UPDATE SUCCESS!");
  }
}
check();
