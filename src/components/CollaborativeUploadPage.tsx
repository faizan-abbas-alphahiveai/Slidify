import React, { useState, useEffect } from 'react';
import { Upload, User, Mail, Send, CheckCircle, AlertCircle, ArrowLeft, Image } from 'lucide-react';
import { supabase, getPublicUrl, getRandomTagline } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';

interface UploadSession {
  id: string;
  max_uploads: number;
  current_uploads: number;
  expires_at: string;
  is_active: boolean;
  creator_user_id: string;
}

interface CreatorUser {
  first_name: string | null;
  last_name: string | null;
}

export default function CollaborativeUploadPage() {
  const [session, setSession] = useState<UploadSession | null>(null);
  const [creatorUser, setCreatorUser] = useState<CreatorUser | null>(null);
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [tagline, setTagline] = useState('Create beautiful slideshows with a few simple clicks');
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get session token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('session');
    
    if (token) {
      setSessionToken(token);
      loadSession(token);
    } else {
      setSessionError('No upload session found');
      setIsLoading(false);
    }
  }, []);

  // Load homepage-like random tagline
  useEffect(() => {
    const loadTagline = async () => {
      try {
        const randomTagline = await getRandomTagline();
        setTagline(randomTagline);
      } catch (e) {
        // keep default tagline on error
        console.error('Error loading tagline:', e);
      }
    };
    loadTagline();
  }, []);

  // Set up real-time subscription for session updates
  useEffect(() => {
    if (!session) return;

    const sessionChannel = supabase
      .channel('upload_session_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'upload_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          console.log('Session updated via real-time:', payload);
          if (payload.new) {
            setSession(payload.new as UploadSession);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'upload_session_images',
          filter: `upload_session_id=eq.${session.id}`
        },
        (payload) => {
          // When a new image is uploaded, refresh the session to get updated counts
          console.log('New image uploaded via real-time:', payload);
          debouncedRefresh(sessionToken);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'upload_session_images',
          filter: `upload_session_id=eq.${session.id}`
        },
        (payload) => {
          // When an image is deleted, refresh the session to get updated counts
          console.log('Image deleted, refreshing session data...');
          debouncedRefresh(sessionToken);
        }
      )
      .subscribe();

    return () => {
      sessionChannel.unsubscribe();
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [session?.id, sessionToken]);

  // Fallback: Periodic refresh every 30 seconds to ensure counts are up to date
  // Only refresh if not currently uploading to avoid disrupting uploads
  useEffect(() => {
    if (!session || !sessionToken) return;

    const interval = setInterval(() => {
      // Don't refresh if user is currently uploading
      if (isUploading || selectedImages.length > 0) {
        console.log('Skipping periodic refresh - user is uploading');
        return;
      }
      
      console.log('Periodic refresh of session data...');
      loadSession(sessionToken);
    }, 30000); // Refresh every 30 seconds instead of 5

    return () => clearInterval(interval);
  }, [session?.id, sessionToken, isUploading, selectedImages.length]);

  // Debounced refresh function to prevent too frequent updates
  const debouncedRefresh = (token: string) => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (!isUploading) {
        console.log('Debounced refresh of session data...');
        loadSession(token);
      }
    }, 2000); // Wait 2 seconds before refreshing
    
    setRefreshTimeout(timeout);
  };

  const loadSession = async (token: string) => {
    try {
      setIsLoading(true);
      setSessionError(null);



      const { data, error } = await supabase
        .from('upload_sessions')
        .select('*') // Select all fields
        .eq('session_token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        setSessionError('Upload session not found or has expired');
        return;
      }

      setSession(data);

      // Fetch creator's user information
      if (data.creator_user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', data.creator_user_id)
          .maybeSingle();

        if (userError) {
          console.error('Error fetching creator user:', userError);
        } else if (userData) {
          setCreatorUser(userData);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setSessionError('Failed to load upload session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!session) return;

    // Filter files by size (10MB limit per file)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB in bytes
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Check 20 image per upload limit
    if (validFiles.length > 20) {
      setError('You can upload a maximum of 20 images at a time. Please select fewer images and upload in batches.');
      return;
    }

    // Check if adding these files would exceed the 20 image limit for current selection
    if (selectedImages.length + validFiles.length > 20) {
      setError('You can select a maximum of 20 images at a time. Please upload your current selection first, then add more images.');
      return;
    }

    // Check total size limit (100MB)
    const currentTotalSize = selectedImages.reduce((total, file) => total + file.size, 0);
    const newFilesTotalSize = validFiles.reduce((total, file) => total + file.size, 0);
    
    if (currentTotalSize + newFilesTotalSize > 100 * 1024 * 1024) { // 100MB in bytes
      setError('Total file size would exceed 100MB limit. Please select smaller files or fewer files.');
      return;
    }

    // Check session upload limit (100 images total)
    const remainingSlots = session.max_uploads - session.current_uploads;
    const availableSlots = Math.max(0, remainingSlots - selectedImages.length);
    
    if (availableSlots <= 0) {
      setError(`Upload limit reached! This session allows a maximum of ${session.max_uploads} images. Currently at ${session.current_uploads}/${session.max_uploads}.`);
      return;
    }
    
    const filesToAdd = validFiles.slice(0, availableSlots);
    
    if (filesToAdd.length < validFiles.length) {
      setError(`Only ${filesToAdd.length} of ${validFiles.length} files can be added. Session limit: ${session.current_uploads}/${session.max_uploads} images.`);
    }
    
    setSelectedImages(prev => [...prev, ...filesToAdd]);
    
    // Clear error after successful upload
    if (error) setError(null);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !sessionToken || selectedImages.length === 0) return;

    // Check if upload would exceed the session limit
    const totalUploads = session.current_uploads + selectedImages.length;
    if (totalUploads > session.max_uploads) {
      setError(`Upload would exceed the limit of ${session.max_uploads} images. You can only upload ${session.max_uploads - session.current_uploads} more images.`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Upload images to storage
      const uploadPromises = selectedImages.map(async (file) => {
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `COLLABORATIVE-${timestamp}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('slideshow-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        return getPublicUrl('slideshow-images', fileName);
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Save image records to database
      const imageRecords = imageUrls.map(url => ({
        upload_session_id: session.id,
        image_url: url,
        uploaded_by_name: uploaderName.trim(),
        uploaded_by_email: uploaderEmail.trim()
      }));

      const { error: dbError } = await supabase
        .from('upload_session_images')
        .insert(imageRecords);

      if (dbError) throw dbError;

      setSuccess(true);
      setSelectedImages([]);
      setUploaderName('');
      setUploaderEmail('');

      // Reload session to get updated counts
      await loadSession(sessionToken);

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (!session) return;

    // Filter files by size (10MB limit per file)
    const validFiles = imageFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB in bytes
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Check 20 image per upload limit
    if (validFiles.length > 20) {
      setError('You can upload a maximum of 20 images at a time. Please select fewer images and upload in batches.');
      return;
    }

    // Check if adding these files would exceed the 20 image limit for current selection
    if (selectedImages.length + validFiles.length > 20) {
      setError('You can select a maximum of 20 images at a time. Please upload your current selection first, then add more images.');
      return;
    }

    // Check total size limit (100MB)
    const currentTotalSize = selectedImages.reduce((total, file) => total + file.size, 0);
    const newFilesTotalSize = validFiles.reduce((total, file) => total + file.size, 0);
    
    if (currentTotalSize + newFilesTotalSize > 100 * 1024 * 1024) { // 100MB in bytes
      setError('Total file size would exceed 100MB limit. Please select smaller files or fewer files.');
      return;
    }

    const remainingSlots = session.max_uploads - session.current_uploads;
    const availableSlots = Math.max(0, remainingSlots - selectedImages.length);
    const filesToAdd = validFiles.slice(0, availableSlots);
    
    setSelectedImages(prev => [...prev, ...filesToAdd]);
    
    // Clear error after successful upload
    if (error) setError(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading upload session...</p>
        </div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center transition-colors">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Upload Session Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {sessionError || 'The upload session you\'re looking for doesn\'t exist or has expired.'}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              <ArrowLeft size={20} />
              Go to Slidify
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center transition-colors">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Images Uploaded Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your images have been added to the slideshow. The creator will be able to include them when they finalize their presentation.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSuccess(false);
                  setSelectedImages([]);
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium"
              >
                Upload More Images
              </button>
              <a
                href="/"
                className="block w-full py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors text-center"
              >
                Visit Slidify.app
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const remainingSlots = session.max_uploads - session.current_uploads;
  const canUploadMore = remainingSlots > 0 && selectedImages.length < Math.min(remainingSlots, 20);
  
  const isUploadValid = () => {
    if (selectedImages.length === 0) return false;
    const totalSize = selectedImages.reduce((total, file) => total + file.size, 0);
    return totalSize <= 100 * 1024 * 1024; // 100MB limit
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <div className="transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>

            <div className="text-center flex-1 relative">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Slidify
              </a>
            </div>

            <div className="flex-shrink-0 w-10" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-8">
        <div className="text-center mb-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Upload Images
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-3">{tagline}</p>
          {creatorUser && (creatorUser.first_name || creatorUser.last_name) && (
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              You are adding images to a slideshow created by {creatorUser.first_name && creatorUser.last_name 
                ? `${creatorUser.first_name} ${creatorUser.last_name}`
                : creatorUser.first_name 
                  ? creatorUser.first_name
                  : creatorUser.last_name
              }.
            </p>
          )}
        </div>

        {/* Session Info - COMMENTED OUT */}
        {/* 
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Images</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div className="rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {session.current_uploads}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Images uploaded</p>
            </div>
            <div className="rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {remainingSlots}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Slots remaining</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
              <span>Upload Progress</span>
              <span>{session.current_uploads} / {session.max_uploads}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300 bg-blue-500"
                style={{ width: `${Math.min(100, (session.current_uploads / session.max_uploads) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        */}

        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm mb-6">
              {error}
            </div>
          )}

          {remainingSlots === 0 ? (
            <div className="text-center py-8">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Upload Session Full
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                This slideshow has reached its maximum capacity of {session.max_uploads} images.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Plan limit reached. Please contact the slideshow creator to address.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info (Optional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={uploaderName}
                      onChange={(e) => setUploaderName(e.target.value)}
                     id="uploader-name"
                     name="uploaderName"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="Your name"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={uploaderEmail}
                      onChange={(e) => setUploaderEmail(e.target.value)}
                     id="uploader-email"
                     name="uploaderEmail"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="your@email.com"
                      maxLength={255}
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Images
                </label>
                
                {selectedImages.length === 0 ? (
                  <div
                    className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      Drag and drop images here, or click to select
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      You can upload up to {Math.min(remainingSlots, 20)} more images at a time
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Recommended: JPG, PNG, GIF up to 10MB per file • Max 20 per upload • Max total: 100MB
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Remaining capacity: {formatFileSize(Math.max(0, 100 * 1024 * 1024 - selectedImages.reduce((total, file) => total + file.size, 0)))}
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File size info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                        <span>{selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected</span>
                        <span>Total size: {formatFileSize(selectedImages.reduce((total, file) => total + file.size, 0))}</span>
                      </div>
                      
                      {/* File size progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300 bg-green-500"
                          style={{ 
                            width: `${Math.min((selectedImages.reduce((total, file) => total + file.size, 0) / (100 * 1024 * 1024)) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {formatFileSize(selectedImages.reduce((total, file) => total + file.size, 0))} / 100 MB
                      </div>
                      
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Selected ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      {/* Add more button */}
                      {canUploadMore && (
                        <div className="space-y-2">
                          <div
                            className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('add-more-images')?.click()}
                          >
                            <Upload className="w-6 h-6 text-gray-400" />
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="add-more-images"
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                            Recommended: JPG, PNG, GIF up to 10MB per file • Max 20 per upload • Max total: 100MB
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                            Remaining capacity: {formatFileSize(Math.max(0, 100 * 1024 * 1024 - selectedImages.reduce((total, file) => total + file.size, 0)))}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                      {canUploadMore && ` • You can add ${Math.min(remainingSlots - selectedImages.length, 20 - selectedImages.length)} more in this batch`}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {selectedImages.length > 0 && (
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isUploading || !isUploadValid()}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Upload {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                  
                  {/* File size error message */}
                  {!isUploadValid() && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                      <p className="text-red-800 dark:text-red-200 text-xs text-center">
                        ❌ Total file size exceeds 100MB limit. Please remove some images or select smaller files.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Powered by <a href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Slidify.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}