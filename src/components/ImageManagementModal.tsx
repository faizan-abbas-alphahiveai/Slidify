import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface ImageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: (File | string)[];
  slideshowPreviewImages: (File | string)[];
  collaborativeImages?: Array<{
    id: string;
    image_url: string;
    uploaded_by_name: string;
    uploaded_by_email: string;
    created_at: string;
  }>;
  onImagesAdded: (selectedImages: (File | string)[], hasSelection: boolean) => void;
  onImagesDeleted: (selectedImages: (File | string)[]) => void;
}

export default function ImageManagementModal({
  isOpen,
  onClose,
  images,
  slideshowPreviewImages,
  collaborativeImages,
  onImagesAdded,
  onImagesDeleted
}: ImageManagementModalProps) {
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Reset selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedImages(new Set());
      setPreviewImage(null);
    }
  }, [isOpen]);

  // Filter out images that are already in the slideshow preview
  // If we have collaborative images, show those instead of local images
  const imagesToShow = collaborativeImages && collaborativeImages.length > 0 
    ? collaborativeImages.map(img => img.image_url)
    : images;

  const availableImages = imagesToShow;

  if (!isOpen) return null;

  const handleImageSelect = (index: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === availableImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(availableImages.map((_, index) => index)));
    }
  };

  const handleAddToSlideshow = () => {
    const selectedImageList = Array.from(selectedImages).map(index => availableImages[index]);
    // Pass the selected images and whether any were selected
    onImagesAdded(selectedImageList, selectedImages.size > 0);
    setSelectedImages(new Set());
    // Don't call onClose here - let the parent component handle it
  };

  const handleDelete = () => {
    if (collaborativeImages && collaborativeImages.length > 0) {
      // For collaborative images, pass the actual collaborative image objects
      const selectedCollaborativeImages = Array.from(selectedImages).map(index => {
        const imageUrl = availableImages[index];
        return collaborativeImages.find(collab => collab.image_url === imageUrl);
      }).filter(Boolean);
      
      // Pass the image URLs for deletion
      const selectedImageUrls = selectedCollaborativeImages.map(img => img!.image_url);
      onImagesDeleted(selectedImageUrls);
    } else {
      // For local images, pass the image URLs as before
      const selectedImageList = Array.from(selectedImages).map(index => availableImages[index]);
      onImagesDeleted(selectedImageList);
    }
    setSelectedImages(new Set());
    // Don't call onClose here - let the parent component handle it
  };

  const getImageSrc = (image: File | string) => {
    return typeof image === 'string' ? image : URL.createObjectURL(image);
  };

  const handleImagePreview = (image: File | string) => {
    setPreviewImage(getImageSrc(image));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {collaborativeImages && collaborativeImages.length > 0 ? 'Collaborative Images' : 'Image Management'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button
            onClick={handleAddToSlideshow}
            disabled={selectedImages.size === 0}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
          >
            Add to slideshow
          </button>
          <button
            onClick={handleDelete}
            disabled={selectedImages.size === 0}
            className="px-4 py-2 bg-gray-500 text-gray-200 rounded-lg hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>

        {/* Select All Toggle */}
        <div className="p-4 border-b border-gray-700">
          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={selectedImages.size === availableImages.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span>Select All ({selectedImages.size}/{availableImages.length})</span>
          </label>
        </div>

        {/* Image Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {availableImages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">
                {collaborativeImages && collaborativeImages.length > 0 
                  ? 'No collaborative images available for management.' 
                  : 'All images are already in the slideshow!'
                }
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {collaborativeImages && collaborativeImages.length > 0 
                  ? 'Images uploaded by others will appear here.' 
                  : 'No images available for management.'
                }
              </p>
            </div>
          ) : (
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableImages.map((image, index) => {
                const collaborativeImage = collaborativeImages && collaborativeImages.length > 0 
                  ? collaborativeImages.find(img => img.image_url === image)
                  : null;
                
                return (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                  >
                    <div className="relative">
                                             <img
                         src={getImageSrc(image)}
                         alt={`Image ${index + 1}`}
                         className="w-full h-32 object-contain rounded-lg bg-gray-100 dark:bg-gray-600 hover:opacity-90 transition-opacity"
                         onClick={() => handleImagePreview(image)}
                       />
                                             {/* Selection Checkbox */}
                       <div className="absolute top-2 left-2">
                         <input
                           type="checkbox"
                           checked={selectedImages.has(index)}
                           onChange={() => handleImageSelect(index)}
                           className="w-5 h-5 text-blue-600 bg-white border-2 border-white rounded focus:ring-blue-500 focus:ring-2 shadow-lg"
                         />
                       </div>
                      
                      
                                             {/* Show uploader info for collaborative images only if name is provided */}
                       {collaborativeImage && collaborativeImage.uploaded_by_name && collaborativeImage.uploaded_by_name.trim() !== '' && (
                         <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-90 text-white p-2 text-center">
                           <div className="font-medium text-sm">
                             {collaborativeImage.uploaded_by_name}
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center text-gray-400 text-sm">
          {selectedImages.size > 0 ? (
            <span>{selectedImages.size} image(s) selected</span>
          ) : (
            <span>No images selected</span>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
