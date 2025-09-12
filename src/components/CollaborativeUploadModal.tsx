import { useState, useEffect, useCallback } from 'react';
import { X, Share2, Copy, Check, Upload, Image, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface UploadSession {
  id: string;
  slideshow_id: string | null;
  session_token: string;
  max_uploads: number;
  current_uploads: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

interface UploadSessionImage {
  id: string;
  image_url: string;
  uploaded_by_name: string;
  uploaded_by_email: string;
  created_at: string;
}

interface CollaborativeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesAdded: (images: string[]) => void;
  infoOnly?: boolean; // When true, only shows feature information without session management
}

export default function CollaborativeUploadModal({ isOpen, onClose, onImagesAdded, infoOnly = false }: CollaborativeUploadModalProps) {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<UploadSession | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadSessionImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const loadActiveSession = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get the most recent active session for this user
      const { data: sessionData, error: sessionError } = await supabase
        .from('upload_sessions')
        .select('*')
        .eq('creator_user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;

      if (sessionData) {
        setActiveSession(sessionData);
        await loadSessionImages(sessionData.id);
      }
    } catch (err) {
      console.error('Error loading active session:', err);
      setError('Failed to load upload session');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user && !infoOnly) {
      loadActiveSession();
      
      // Set up real-time subscription to session changes
      const sessionChannel = supabase
        .channel('upload_sessions_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'upload_sessions',
            filter: `creator_user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new) {
              setActiveSession(prev => {
                if (prev && payload.new && payload.new.id === prev.id) {
                  return payload.new as UploadSession;
                }
                return prev;
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'upload_session_images'
          },
          (payload) => {
            if (payload.new) {
              setActiveSession(prev => {
                if (prev && payload.new && payload.new.upload_session_id === prev.id) {
                  loadSessionImages(prev.id);
              // Refresh session data to get updated counts
              loadActiveSession();
                }
                return prev;
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'upload_session_images'
          },
          (payload) => {
            if (payload.old) {
              setActiveSession(prev => {
                if (prev && payload.old && payload.old.upload_session_id === prev.id) {
                  loadSessionImages(prev.id);
              // Refresh session data to get updated counts
              loadActiveSession();
                }
                return prev;
              });
            }
          }
        )
        .subscribe();

      return () => {
        sessionChannel.unsubscribe();
      };
    }
  }, [isOpen, user, infoOnly, loadActiveSession]);

  const loadSessionImages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('upload_session_images')
        .select('*')
        .eq('upload_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploadedImages(data || []);
    } catch (err) {
      console.error('Error loading session images:', err);
    }
  };




  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const selectAllImages = () => {
    setSelectedImages(new Set(uploadedImages.map(img => img.id)));
  };

  const deselectAllImages = () => {
    setSelectedImages(new Set());
  };

  const addImagesToSlideshow = async () => {
    if (!activeSession || selectedImages.size === 0) return;

    try {
      // Add only selected images to the current slideshow
      const selectedImageUrls = uploadedImages
        .filter(img => selectedImages.has(img.id))
        .map(img => img.image_url);
      
      onImagesAdded(selectedImageUrls);
      
      // Remove selected images from the database
      const { error: deleteError } = await supabase
        .from('upload_session_images')
        .delete()
        .in('id', Array.from(selectedImages));

      if (deleteError) {
        console.error('Error removing selected images:', deleteError);
        setError('Failed to remove selected images');
        return;
      }

      // Clear selection and refresh the images list
      setSelectedImages(new Set());
      
      // Reload session images to reflect the changes
      if (activeSession) {
        await loadSessionImages(activeSession.id);
      }
      
      onClose();
    } catch (err) {
      console.error('Error adding images to slideshow:', err);
      setError('Failed to add images to slideshow');
    }
  };

  const copyShareLink = async () => {
    if (!activeSession) return;

    const shareLink = `${window.location.origin}/upload?session=${encodeURIComponent(activeSession.session_token)}`;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };



  // Function to download QR code as image
  const downloadQRCode = () => {
    try {
      const qrCodeElement = document.querySelector('[data-qr-code]') as HTMLElement;
      if (!qrCodeElement) {
        console.error('QR code element not found');
        return;
      }

      const svg = qrCodeElement.querySelector('svg');
      if (!svg) {
        console.error('SVG element not found');
        return;
      }

      // Create a canvas to convert SVG to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = document.createElement('img');
      
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Create download link
          const link = document.createElement('a');
          link.download = 'slidify-qr-code.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          // Optional: Show success message

        } catch {
          console.error('Error creating download');
        }
      };
      
      img.onerror = () => {
        console.error('Error loading SVG image');
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      console.error('Error downloading QR code');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full">
                <Share2 className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Collaborative Upload
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
            Create a shareable link that allows friends, family, or colleagues to upload images directly to your slideshow. Perfect for events, trips, or group projects!
          </p>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {infoOnly ? (
              <div className="space-y-6">
                {/* Feature Explanation */}
                <div>
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Allow Uploads</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Up to 100 images can be uploaded by contributors
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Contributors can optionally provide their name and email
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        You control when to add the uploaded images to your slideshow
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : activeSession ? (
              <div className="space-y-6">
                {/* Session Info */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Allow Uploads</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Up to 100 images can be uploaded by contributors
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Contributors can optionally provide their name and email
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        You control when to add the uploaded images to your slideshow
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700 space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Images uploaded:</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {Math.min(uploadedImages.length, activeSession.max_uploads)} / {activeSession.max_uploads}
                  </span>
                </div>

                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (Math.min(uploadedImages.length, activeSession.max_uploads) / activeSession.max_uploads) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Share Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Share this link with others:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/upload?session=${encodeURIComponent(activeSession.session_token)}`}
                      readOnly
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                    />
                    <button
                      onClick={copyShareLink}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title={copied ? "Copied!" : "Copy link"}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      title={showQrCode ? "Hide QR code" : "Show QR code"}
                    >
                      <QrCode size={16} />
                    </button>
                  </div>
                </div>

                {/* QR Code Display */}
                {showQrCode && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h4 
                        className="font-semibold text-gray-800 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={downloadQRCode}
                        title="Click to download QR code"
                      >
                        QR Code
                      </h4>
                      <button
                        onClick={() => setShowQrCode(false)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div 
                      className="bg-white p-4 rounded-lg inline-block cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={downloadQRCode}
                      title="Click to download QR code"
                      data-qr-code
                    >
                      <QRCodeSVG
                        value={`${window.location.origin}/upload?session=${encodeURIComponent(activeSession.session_token)}`}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                      Scan this QR code to quickly access the upload page
                    </p>
                  </div>
                )}

                {/* Uploaded Images */}
                {uploadedImages.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <Image className="text-blue-600 dark:text-blue-400" size={18} />
                      Uploaded Images ({uploadedImages.length})
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllImages}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={deselectAllImages}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                      {uploadedImages.map((image) => (
                        <div 
                          key={image.id} 
                          className={`relative group cursor-pointer rounded-lg overflow-hidden ${
                            selectedImages.has(image.id) 
                              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' 
                              : ''
                          }`}
                          onClick={() => toggleImageSelection(image.id)}
                        >
                          <img
                            src={image.image_url}
                            alt="Uploaded"
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          {/* Selection indicator */}
                          <div className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-all ${
                            selectedImages.has(image.id)
                              ? 'bg-blue-500'
                              : 'bg-black/30 hover:bg-black/50'
                          }`}>
                            {selectedImages.has(image.id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {(image.uploaded_by_name || image.uploaded_by_email) && (
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <div className="text-white text-xs text-center p-2">
                                {image.uploaded_by_name && (
                                  <p className="font-medium">{image.uploaded_by_name}</p>
                                )}
                                {image.uploaded_by_email && (
                                  <p className="opacity-80">{image.uploaded_by_email}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedImages.size > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {/* Add to Slideshow Button - Separate row for better visibility */}
                {selectedImages.size > 0 && (
                  <button
                    onClick={addImagesToSlideshow}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    Add {selectedImages.size} Selected Image{selectedImages.size !== 1 ? 's' : ''} to Slideshow
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Feature Explanation */}
                <div>
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Allow Uploads</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Up to 100 images can be uploaded by contributors
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Contributors can optionally provide their name and email
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                        <Check className="text-blue-600 dark:text-blue-400" size={12} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        You control when to add the uploaded images to your slideshow
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}