import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Facebook from 'expo-facebook';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastInitial: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signInWithFacebook: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  /**
   * Creates a profile for a new OAuth user if one doesn't exist
   * Extracts first name and last initial from user metadata
   */
  const createOAuthProfileIfNeeded = async (user: User): Promise<void> => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      const nameParts = user.user_metadata?.full_name?.split(' ') || ['User', 'U'];
      const firstName = nameParts[0] || 'User';
      const lastInitial = nameParts[nameParts.length - 1]?.[0] || 'U';

      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email || '',
        first_name: firstName,
        last_initial: lastInitial.toUpperCase(),
      });

      if (profileError) throw profileError;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await createOAuthProfileIfNeeded(session.user);
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } else {
      const redirectUrl = makeRedirectUri({
        scheme: 'twelvesteptracker',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const access_token = url.searchParams.get('access_token');
          const refresh_token = url.searchParams.get('refresh_token');

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) throw sessionError;

            if (sessionData.user) {
              await createOAuthProfileIfNeeded(sessionData.user);
            }
          }
        }
      }
    }
  };

  const signInWithFacebook = async () => {
    try {
      if (Platform.OS === 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: window.location.origin,
            scopes: 'email public_profile',
          },
        });
        if (error) throw error;
      } else {
        // Native flow using expo-facebook
        const appId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
        if (!appId) {
          throw new Error('Facebook App ID not configured');
        }

        // Initialize Facebook SDK
        await Facebook.initializeAsync({
          appId: appId,
        });

        // Request login with read permissions
        const result = await Facebook.logInWithReadPermissionsAsync({
          permissions: ['public_profile', 'email'],
        });

        if (result.type === 'cancel') {
          // User cancelled - return gracefully
          return;
        }

        if (result.type !== 'success') {
          throw new Error('Facebook sign in failed');
        }

        if (!result.token) {
          throw new Error('No access token received from Facebook');
        }

        // Exchange Facebook token with Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: result.token,
        });

        if (sessionError) throw sessionError;

        // Create profile if needed
        if (sessionData.user) {
          await createOAuthProfileIfNeeded(sessionData.user);
        }
      }
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastInitial: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        first_name: firstName,
        last_initial: lastInitial.toUpperCase(),
      });
      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signInWithGoogle,
        signInWithFacebook,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
