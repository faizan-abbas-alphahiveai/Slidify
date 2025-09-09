import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <Shield className="text-blue-600" size={32} />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              Privacy Policy
            </h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 transition-colors">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Slidify.app – Privacy Policy</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Effective Date: January 25, 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              At Slidify Technologies Inc., we are committed to protecting your privacy. This Privacy Policy explains 
              how we collect, use, and safeguard your information when you use Slidify.app.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Information We Collect</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">We collect information you provide directly to us:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Account information (email, name)</li>
                <li>Content you upload (images, audio files)</li>
                <li>Usage data and analytics</li>
                <li>Communication with our support team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>To provide and maintain our Service</li>
                <li>To process your slideshows and content</li>
                <li>To communicate with you about your account</li>
                <li>To improve our Service and user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Information Sharing</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We do not sell, trade, or rent your personal information to third parties. We may share information 
                only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist in operating our Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We implement appropriate security measures to protect your information against unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">For privacy-related questions, contact:</p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
                <p className="text-gray-800 dark:text-white font-medium">Slidify Technologies Inc.</p>
                <p className="text-gray-600 dark:text-gray-300">Ottawa, Ontario, Canada</p>
                <p className="text-gray-600 dark:text-gray-300">📧 privacy@slidify.app</p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="mb-6">
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
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Privacy Policy
              </a>
              <span className="hidden sm:inline">•</span>
              <a
                href="/release-notes"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
          </div>
          
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            <ArrowLeft size={20} />
            Return to Slidify
          </a>
        </div>
      </div>
    </div>
  );
}