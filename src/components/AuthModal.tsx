import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { signUp, signIn, sendPasswordResetEmail } from '../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSignUpSuccess?: () => void;
}

type ModalMode = 'signIn' | 'signUp' | 'forgotPassword';
export default function AuthModal({ isOpen, onClose, onSuccess, onSignUpSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<ModalMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signUp') {
        if (!termsAccepted) {
          throw new Error('You must accept the Terms and Conditions to create an account');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const passwordError = validatePassword(password);
        if (passwordError) {
          throw new Error(passwordError);
        }
        const result = await signUp(email, password, firstName.trim(), lastName.trim());

        
        // Check if email confirmation is required
        if (result && result.user && !result.user.email_confirmed_at) {
          setEmailConfirmationRequired(true);
          return;
        }
        
        // Call the sign up success callback if provided
        if (onSignUpSuccess) {
          onSignUpSuccess();
        }
      } else if (mode === 'signIn') {
        await signIn(email, password);
      }
      
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Auth error:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(email);
      setResetEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setTermsAccepted(false);
    setError(null);
    setResetEmailSent(false);
    setEmailConfirmationRequired(false);
  };

  const handleClose = () => {
    resetForm();
    setMode('signIn');
    onClose();
  };

  const switchMode = (newMode: ModalMode) => {
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setResetEmailSent(false);
    setEmailConfirmationRequired(false);
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (mode) {
      case 'signUp': return 'Create Account';
      case 'forgotPassword': return 'Reset Password';
      default: return 'Sign In';
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              {getTitle()}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error === 'Invalid login credentials' || error === 'User already registered' || error === 'Passwords do not match' ? (
                <div>
                  <p className="font-medium mb-1">
                    {error === 'Passwords do not match' ? 'Password Mismatch' :
                      mode === 'signUp' ? 
                        (error === 'User already registered' ? 'Account already exists' : 'Account creation failed') 
                        : 'Sign in failed'}
                  </p>
                  <p>
                    {error === 'Passwords do not match' ? 
                      'The passwords you entered do not match. Please re-enter them carefully.' :
                      mode === 'signUp' 
                        ? (error === 'User already registered' 
                            ? 'An account with this email already exists. Please sign in instead or use a different email address.'
                            : 'This email may already be registered. Try signing in instead, or use a different email address.')
                        : 'Please check your email and password. Make sure you\'ve entered them correctly.'
                      }
                  </p>
                </div>
              ) : (
                error
              )}
            </div>
          )}

          {mode === 'forgotPassword' ? (
            resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-medium mb-2">
                    Password reset email sent!
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    Check your email for a link to reset your password. If you don't see it, check your spam folder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                   id="reset-email"
                   name="email"
                   id="auth-email"
                   name="email"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    placeholder="Enter your email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('signIn')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : !emailConfirmationRequired && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Lock size={16} />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              {mode === 'signUp' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock size={16} />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                   id="auth-password"
                   name="password"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    placeholder="Confirm your password"
                  />
                  {mode === 'signUp' && password && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <p className="mb-1">Password must contain:</p>
                      <ul className="space-y-1">
                        <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          At least 8 characters
                        </li>
                        <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          One uppercase letter
                        </li>
                        <li className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          One lowercase letter
                        </li>
                        <li className={`flex items-center gap-1 ${/\d/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          One number
                        </li>
                        <li className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          One special character
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {mode === 'signUp' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                       id="auth-first-name"
                       name="firstName"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        placeholder="First name"
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                       id="auth-last-name"
                       name="lastName"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        placeholder="Last name"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms-checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                     id="auth-confirm-password"
                     name="confirmPassword"
                    />
                    <label htmlFor="terms-checkbox" className="text-sm text-gray-700 dark:text-gray-300">
                      I agree to the{' '}
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        Terms and Conditions
                      </a>
                      {' '}and{' '}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                </>
              )}

              {mode === 'signIn' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchMode('forgotPassword')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (mode === 'signUp' && (!email || !password || !confirmPassword || !termsAccepted))}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                title={mode === 'signUp' && (!email || !password || !confirmPassword || !termsAccepted) 
                  ? `Missing: ${[
                      !email && 'email',
                      !password && 'password', 
                      !confirmPassword && 'confirm password',
                      !termsAccepted && 'terms acceptance'
                    ].filter(Boolean).join(', ')}`
                  : ''
                }
              >
                {isLoading ? 'Please wait...' : (mode === 'signUp' ? 'Create Account' : 'Sign In')}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signUp' ? 'signIn' : 'signUp')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {mode === 'signUp' 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}