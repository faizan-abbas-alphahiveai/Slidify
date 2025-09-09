import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsAndConditions() {
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
            <FileText className="text-blue-600" size={32} />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              Terms and Conditions of Use
            </h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 transition-colors">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Slidify.app – Terms and Conditions</strong>
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
              Welcome to Slidify.app, a product of Slidify Technologies Inc., headquartered in Ottawa, Ontario, Canada. 
              These Terms and Conditions ("Terms") govern your access to and use of the Slidify.app website and related 
              services ("Service").
            </p>
            
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              By using the Service, you agree to these Terms. If you do not agree, do not access or use the Service.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">1. Eligibility</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You must be the age of majority in your province or territory (or have legal guardian consent) to use the Service. 
                If you're using the Service on behalf of an organization, you represent you have authority to bind that entity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">2. Account Registration</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You agree to provide accurate and complete information during account registration. You are responsible for 
                maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">3. Acceptable Use</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Violate any law or third-party rights;</li>
                <li>Use the Service to transmit harmful, abusive, defamatory, or illegal content;</li>
                <li>Access the Service in a way that could impair its performance or security;</li>
                <li>Reverse-engineer or exploit the Service's source code.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">4. User Content</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You retain ownership of any images, audio, text, or other content ("User Content") uploaded to Slidify. 
                By uploading content, you grant us a non-exclusive, worldwide license to use, display, and distribute it 
                solely for the purposes of operating and improving the Service.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                You warrant you own or have rights to the User Content and that it does not infringe on others' rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">5. Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Slidify.app and its content (excluding User Content) are protected by copyright, trademark, and other laws. 
                All rights not expressly granted to you are reserved by Slidify Technologies Inc.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">6. Third-Party Links & Services</h2>
              <p className="text-gray-700 dark:text-gray-300">
                The Service may contain links to third-party websites or services. We are not responsible for their content 
                or privacy practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">7. Termination</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to suspend or terminate your access to the Service at any time, without prior notice 
                or liability, for any reason including breach of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">8. Disclaimers and Limitation of Liability</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>The Service is provided "as is" without warranties. Slidify makes no guarantees regarding availability, security, or performance.</li>
                <li>To the extent permitted by law, Slidify is not liable for any indirect or consequential damages.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">9. Indemnification</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You agree to indemnify and hold harmless Slidify Technologies Inc. and its employees from any claims, damages, 
                or losses arising out of your use of the Service or your violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">10. Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms are governed by the laws of Ontario and the federal laws of Canada. Disputes will be resolved 
                exclusively in the courts located in Ottawa, Ontario.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">11. Modifications to the Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update these Terms from time to time. We will notify users of material changes. Continued use of 
                the Service means you accept the revised Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">12. Contact</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">For questions about these Terms, contact:</p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
                <p className="text-gray-800 dark:text-white font-medium">Slidify Technologies Inc.</p>
                <p className="text-gray-600 dark:text-gray-300">Ottawa, Ontario, Canada</p>
                <p className="text-gray-600 dark:text-gray-300">📧 support@slidify.app</p>
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
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
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