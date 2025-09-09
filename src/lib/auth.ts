import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

export interface AuthUser extends User {}

export const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Handle specific database errors with more user-friendly messages
      if (error.message.includes('Database error saving new user')) {
        throw new Error('Unable to create account at this time. Please try again in a few minutes or contact support if the issue persists.');
      }
      throw error;
    }
  
    // If sign up was successful and we have name data, create/update the user profile
    if (data.user && (firstName || lastName)) {
      // Add a small delay to allow the database trigger to create the user record
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Use upsert to handle both insert and update cases
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName || '',
            last_name: lastName || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.error('Error creating/updating user profile:', profileError);
          // Don't throw error here - user account is still created
        }
      } catch (profileError) {
        console.error('Error creating/updating user profile:', profileError);
        // Don't throw error here - user account is still created
      }
    }
  
    // Check if email confirmation is required
    if (data.user && !data.user.email_confirmed_at) {
      // Return a special status indicating email confirmation is required
      return { ...data, type: 'email_confirmation_required' };
    }
    
    return data;
  } catch (error: any) {
    // Handle network or other unexpected errors
    if (error.message?.includes('Database error saving new user') || 
        error.message?.includes('unexpected_failure')) {
      throw new Error('Unable to create account due to a server issue. Please try again in a few minutes or contact support if the problem continues.');
    }
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `https://slidify.app?type=recovery`
  });
  
  if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    // If session is invalid, clear it to prevent repeated failed requests
    await supabase.auth.signOut();
    return null;
  }
};

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);

  useEffect(() => {
    // Get initial user
    getCurrentUser().then(async (user) => {
      setUser(user);
      if (user) {
        // Load user profile
        try {
          const { data } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', user.id);
          
          if (data && data.length > 0) {
            setUserProfile(data[0]);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        // Load user profile
        try {
          const { data } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', user.id);
          
          if (data && data.length > 0) {
            setUserProfile(data[0]);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id);
      
      if (data && data.length > 0) {
        setUserProfile(data[0]);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };
  const getDisplayName = () => {
    if (!user) return '';
    
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    } else if (userProfile?.first_name) {
      return userProfile.first_name;
    } else {
      return user.email?.split('@')[0] || '';
    }
  };

  return { user, userProfile, getDisplayName, signOut, refreshUserProfile };
};