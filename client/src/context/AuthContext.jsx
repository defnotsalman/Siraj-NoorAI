import { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { getUserProfile } from '../services/profile';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async (uid) => {
    try {
      const data = await getUserProfile(uid);
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoadingProfile(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime Profile Subscription
  useEffect(() => {
    let profileSubscription = null;

    if (user) {
      profileSubscription = supabase
        .channel('custom-update-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
          (payload) => {
            setProfile(payload.new);
          }
        )
        .subscribe();
    }

    return () => {
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, [user]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id); // Supabase uses .id, Firebase used .uid
    }
  };

  const loading = loadingAuth || loadingProfile;

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
