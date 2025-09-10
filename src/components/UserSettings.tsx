import React, { useState, useEffect } from 'react';
import { X, User, Save, Loader2, Crown, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useSubscription } from '../lib/subscription';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
}

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const { user, refreshUserProfile } = useAuth();
  const { isPremium } = useSubscription();
  const [profile, setProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    email: ''
  });
  
  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setError(null);

      // First try to get data from the users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading user profile:', error);
        
        // Try alternative query approaches
        
        // Try without the ID filter first
        try {
          const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('*')
            .limit(5);
          
          if (allUsersError) {
            console.error('Error querying all users:', allUsersError);
          }
        } catch (altErr) {
          console.error('Alternative query failed:', altErr);
        }
        
        throw error;
      }

      if (data) {
        const userProfileData = {
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || ''
        };
        setProfile(userProfileData);
        setOriginalProfile(userProfileData);
      } else {
        // If no data in users table, create a basic profile with just email
        // The names will be empty and user can fill them in
        const userProfileData = {
          first_name: '',
          last_name: '',
          email: user.email || ''
        };
        setProfile(userProfileData);
        setOriginalProfile(userProfileData);
        
        // Try to create the user record in the users table
        try {
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              first_name: '',
              last_name: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (createError) {
            console.error('Error creating user profile:', createError);
            // Silently handle creation error - user can still edit and save
          }
        } catch (createErr) {
          console.error('Error creating user profile:', createErr);
          // Silently handle creation error - user can still edit and save
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
      // Fallback to basic profile
      const userProfileData = {
        first_name: '',
        last_name: '',
        email: user.email || ''
      };
      setProfile(userProfileData);
      setOriginalProfile(userProfileData);
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    if (isOpen && user && !hasLoadedOnce) {
      loadUserProfile();
    }
  }, [isOpen, user]);



  useEffect(() => {
    // Check if there are any changes compared to original profile
    const changed = 
      profile.first_name !== originalProfile.first_name ||
      profile.last_name !== originalProfile.last_name ||
      profile.email !== originalProfile.email;
    setHasChanges(changed);
  }, [profile, originalProfile]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasChanges) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);
    setEmailChanged(false);

    try {
      // First try to update existing record
      let { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          email: profile.email.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // If update fails (record doesn't exist), try to insert
      if (profileError && profileError.code === '42501') {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            first_name: profile.first_name.trim(),
            last_name: profile.last_name.trim(),
            email: profile.email.trim(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      } else if (profileError) {
        throw profileError;
      }

      // Update email in auth if it changed
      const emailChanged = profile.email !== originalProfile.email;
      if (emailChanged) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profile.email.trim()
        });
        
        if (emailError) {
          // If email update fails, revert the profile change
          await supabase
            .from('users')
            .update({
              first_name: originalProfile.first_name,
              last_name: originalProfile.last_name,
              email: originalProfile.email,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          throw emailError;
        }
      }

      setSuccess(true);
      setEmailChanged(emailChanged);
      setOriginalProfile(profile);
      setHasChanges(false);
      await refreshUserProfile();
      
      setTimeout(() => {
        setSuccess(false);
        setEmailChanged(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setProfile(originalProfile);
    setHasChanges(false);
    setError(null);
    setSuccess(false);
    setEmailChanged(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              User Settings
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 relative">
          {isLoading && !hasLoadedOnce ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {isSaving && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
                  {emailChanged 
                    ? 'Confirmation email sent. Please verify to update.'
                    : 'Profile updated successfully!'
                  }
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  id="user-email"
                  name="email"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="Enter your email"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Changing email will require re-verification
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  id="user-first-name"
                  name="firstName"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="Enter your first name"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  id="user-last-name"
                  name="lastName"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="Enter your last name"
                  maxLength={50}
                />
              </div>

              {/* Premium Account Management */}
              {isPremium && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Premium Account
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open('https://dashboard.stripe.com/login', '_blank')}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Manage Premium Account
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Manage your subscription, billing, and payment methods
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges || isSaving}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}