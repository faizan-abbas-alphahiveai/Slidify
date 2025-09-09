import React from 'react';
import { ArrowLeft, Rocket, Calendar, Star, Zap, Bug, Plus, Sparkles } from 'lucide-react';

export default function ReleaseNotes() {
  const releases = [
    {
      version: '2.2.0',
      date: 'January 31, 2025',
      type: 'major',
      features: [
        'Complete visual redesign with new blue/cyan color scheme',
        'Enhanced Lottie animations with separate light and dark mode versions',
        'Improved slideshow transitions with 20+ professional PowerPoint-style effects',
        'Advanced transition timing with smooth, elastic, and power easing options',
        'Better visual hierarchy and contrast ratios for improved accessibility'
      ],
      improvements: [
        'Unified color palette across all components and modals',
        'Enhanced slideshow preview with better visual feedback',
        'Improved theme consistency in success and conversion modals',
        'Updated feedback modal to match blue/cyan color scheme',
        'Fixed custom scrollbar colors throughout the application',
        'Better mobile responsiveness for slideshow controls',
        'Optimized transition performance and smoothness'
      ],
      fixes: [
        'Fixed duplicate headings in slideshow viewer',
        'Resolved color inconsistencies across different components',
        'Fixed theme switching issues in embedded previews',
        'Removed purple elements from feedback modal thank you popup'
      ]
    },
    {
      version: '2.1.0',
      date: 'January 30, 2025',
      type: 'major',
      features: [
        'Enhanced transition effects with 20+ new animation options',
        'Improved slideshow performance and loading times',
        'Better mobile touch controls for navigation',
        'Premium subscription with unlimited features'
      ],
      improvements: [
        'Redesigned user interface with better accessibility',
        'Optimized image compression for faster uploads',
        'Enhanced audio synchronization'
      ],
      fixes: [
        'Fixed slideshow timing issues on slower devices',
        'Resolved audio playback problems in Safari',
        'Fixed image orientation issues on mobile uploads'
      ]
    },
    {
      version: '2.0.0',
      date: 'January 25, 2025',
      type: 'major',
      features: [
        'Complete UI redesign with modern dark/light theme support',
        'User authentication and account management',
        'Save and manage multiple slideshows',
        'Background music library integration',
        'Advanced transition effects (fade, slide, scale, flip, zoom)',
        'Drag and drop image reordering'
      ],
      improvements: [
        'Responsive design for all device sizes',
        'Improved slideshow sharing capabilities',
        'Better error handling and user feedback'
      ],
      fixes: [
        'Fixed memory leaks in slideshow playback',
        'Resolved cross-browser compatibility issues'
      ]
    },
    {
      version: '1.5.0',
      date: 'January 20, 2025',
      type: 'minor',
      features: [
        'Added slideshow preview functionality',
        'Introduced custom slide duration settings',
        'Basic transition effects (fade, slide)'
      ],
      improvements: [
        'Enhanced image upload experience',
        'Better mobile responsiveness'
      ],
      fixes: [
        'Fixed slideshow auto-advance timing',
        'Resolved image loading issues'
      ]
    },
    {
      version: '1.0.0',
      date: 'January 15, 2025',
      type: 'major',
      features: [
        'Initial release of Slidify.app',
        'Basic slideshow creation with image uploads',
        'Simple sharing via generated links',
        'Basic slideshow playback controls'
      ]
    }
  ];

  const getVersionIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <Rocket className="text-blue-600" size={20} />;
      case 'minor':
        return <Star className="text-blue-600" size={20} />;
      default:
        return <Zap className="text-green-600" size={20} />;
    }
  };

  const getVersionBadge = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'minor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Slidify
          </a>
          
          <div className="flex items-center gap-3 mb-4">
            <Rocket className="text-blue-600" size={32} />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              Release Notes
            </h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 transition-colors">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Slidify.app – What's New</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Stay up to date with the latest features, improvements, and bug fixes
            </p>
          </div>
        </div>

        {/* Release Timeline */}
        <div className="space-y-8">
          {/* What's Coming Soon Section */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-xl shadow-lg transition-colors">
            <div className="p-6 border-b border-blue-200 dark:border-blue-600">
              <div className="flex items-center gap-3">
                <Sparkles className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  What's coming soon!
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Upcoming Features */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  <Star className="text-blue-600" size={18} />
                  Features
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                      <Plus className="text-blue-600 dark:text-blue-400" size={12} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Enhanced music library with more tracks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                      <Plus className="text-blue-600 dark:text-blue-400" size={12} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Custom audio upload for voiceovers and personal music</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                      <Plus className="text-blue-600 dark:text-blue-400" size={12} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Slideshow analytics and sharing statistics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                      <Plus className="text-blue-600 dark:text-blue-400" size={12} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Edit existing slideshows after creation</span>
                  </li>
                </ul>
              </div>

              {/* Upcoming Bug Fixes */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  <Bug className="text-green-600" size={18} />
                  Bug Fixes
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0 mt-0.5">
                      <Bug className="text-green-600 dark:text-green-400" size={12} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Payments... we will soon be launching Premium!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {releases.map((release, index) => (
            <div key={release.version} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors">
              {/* Release Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getVersionIcon(release.type)}
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Version {release.version}
                    </h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVersionBadge(release.type)}`}>
                      {release.type.charAt(0).toUpperCase() + release.type.slice(1)} Release
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Calendar size={16} />
                    <span className="text-sm">{release.date}</span>
                  </div>
                </div>
              </div>

              {/* Release Content */}
              <div className="p-6 space-y-6">
                {/* New Features */}
                {release.features && release.features.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white mb-3">
                      <Sparkles className="text-blue-600" size={18} />
                      New Features
                    </h3>
                    <ul className="space-y-2">
                      {release.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                            <Plus className="text-blue-600 dark:text-blue-400" size={12} />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {release.improvements && release.improvements.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white mb-3">
                      <Zap className="text-blue-600" size={18} />
                      Improvements
                    </h3>
                    <ul className="space-y-2">
                      {release.improvements.map((improvement, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0 mt-0.5">
                            <Zap className="text-blue-600 dark:text-blue-400" size={12} />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bug Fixes */}
                {release.fixes && release.fixes.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white mb-3">
                      <Bug className="text-green-600" size={18} />
                      Bug Fixes
                    </h3>
                    <ul className="space-y-2">
                      {release.fixes.map((fix, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0 mt-0.5">
                            <Bug className="text-green-600 dark:text-green-400" size={12} />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{fix}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 transition-colors">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Have feedback or suggestions?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We'd love to hear from you! Your feedback helps us make Slidify better.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              <ArrowLeft size={20} />
              Return to Slidify
            </a>
          </div>
        </div>

        {/* Page Footer with Links */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <a
              href="/terms"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Terms and Conditions
            </a>
            <span className="hidden sm:inline">•</span>
            <a
              href="/privacy"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="hidden sm:inline">•</span>
            <a
              href="/release-notes"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              Release Notes
            </a>
            <span className="hidden sm:inline">•</span>
            <a
              href="/contact"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Contact
            </a>
          </div>
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © 2025 Slidify Technologies Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}