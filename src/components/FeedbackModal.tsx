import React, { useState } from 'react';
import { X, MessageSquare, Star } from 'lucide-react';
import { submitUserFeedback, getRandomFeedbackHeading } from '../lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [starRating, setStarRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [lovedFeature, setLovedFeature] = useState('');
  const [improvement, setImprovement] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackHeading, setFeedbackHeading] = useState('Give us Feedback');

  // Load random feedback heading when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const loadFeedbackHeading = async () => {
        try {
          const randomHeading = await getRandomFeedbackHeading();
          setFeedbackHeading(randomHeading);
        } catch (error) {
          console.error('Error loading feedback heading:', error);
          // Keep default heading if loading fails
        }
      };
      loadFeedbackHeading();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitUserFeedback({
        starRating,
        lovedFeature,
        improvement,
        firstName,
        email
      });

      setSubmitted(true);
      
      // Close modal after showing success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // You could add error handling here if needed
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStarRating(0);
    setHoveredStar(0);
    setLovedFeature('');
    setImprovement('');
    setFirstName('');
    setEmail('');
    setSubmitted(false);
    setIsSubmitting(false);
    setFeedbackHeading('Give us Feedback');
    onClose();
  };

  const handleStarClick = (rating: number) => {
    setStarRating(rating);
  };

  const handleStarHover = (rating: number) => {
    setHoveredStar(rating);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transition-colors">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Thank you!
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              We appreciate your feedback and are always looking to improve the product.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={48} />
              {feedbackHeading}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Question 1: Overall Experience */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                How was your overall experience with Slidify?
              </h3>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    className="p-1 transition-colors"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= (hoveredStar || starRating)
                          ? 'text-blue-500 fill-blue-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: What did you love */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                What did you love (or at least like-like) about Slidify?
              </h3>
              <textarea
                value={lovedFeature}
                onChange={(e) => setLovedFeature(e.target.value)}
               id="feedback-loved-feature"
               name="lovedFeature"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
                rows={2}
                placeholder="Your favorite part, feature, or 'that was slick' moment."
              />
            </div>

            {/* Question 3: Magic wand improvement */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                If you had a magic wand, what's one thing you'd add or change?
              </h3>
              <textarea
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
               id="feedback-improvement"
               name="improvement"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
                rows={2}
                placeholder="Dream big — we'll take it from here."
              />
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
              <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">
                Want to hear back from us? (Optional)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                   id="feedback-first-name"
                   name="firstName"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                   id="feedback-email"
                   name="email"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || starRating === 0}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}