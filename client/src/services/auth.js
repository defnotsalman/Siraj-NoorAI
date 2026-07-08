import { supabase } from '../supabase/supabaseClient';

export const registerUser = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  
  // Supabase returns a fake user with empty identities if the email already exists 
  // (to prevent email enumeration). We need to throw an error to mimic Firebase.
  if (data?.user?.identities?.length === 0) {
    throw new Error("already registered");
  }

  // Supabase returns { user, session } inside data
  return { user: data.user };
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return { user: data.user };
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const sendPasswordResetEmail = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw error;
  return data;
};