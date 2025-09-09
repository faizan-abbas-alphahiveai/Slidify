import React, { useEffect, useState } from 'react';
import { 
  Upload, Music, Play, Pause, Settings, User, Share2, Eye, Trash2, 
  Crown, Star, Heart, CheckCircle, AlertTriangle, Info, X, Copy,
  Mail, Lock, Calendar, Clock, MessageSquare, Image, Video
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function UITest() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 transition-colors"
    >
      <style>{`
        .dark .min-h-screen {
          background: #010165 !important;
        }
      `}</style>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              UI Test Page
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Testing colors, fonts, and styling elements
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Typography Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-blue-600" />
            Typography
          </h2>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Heading 1 - Bold</h1>
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">Heading 2 - Semibold</h2>
            <h3 className="text-2xl font-medium text-gray-800 dark:text-white">Heading 3 - Medium</h3>
            <h4 className="text-xl font-medium text-gray-800 dark:text-white">Heading 4 - Medium</h4>
            <p className="text-lg text-gray-700 dark:text-gray-300">Large paragraph text</p>
            <p className="text-base text-gray-700 dark:text-gray-300">Regular paragraph text with some longer content to see how it flows</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Small text for captions and secondary information</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Extra small text for fine print</p>
          </div>
        </div>

        {/* Color Palette */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Heart className="w-6 h-6 text-blue-600" />
            Color Palette
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Primary Colors */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800 dark:text-white">Primary</h3>
              <div className="w-full h-12 bg-blue-600 rounded-lg"></div>
              <div className="w-full h-12 bg-blue-700 rounded-lg"></div>
              <div className="w-full h-12 bg-cyan-600 rounded-lg"></div>
              <div className="w-full h-12 bg-cyan-700 rounded-lg"></div>
            </div>
            
            {/* Gray Scale */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800 dark:text-white">Grays</h3>
              <div className="w-full h-12 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
              <div className="w-full h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
              <div className="w-full h-12 bg-gray-300 dark:bg-gray-500 rounded-lg"></div>
              <div className="w-full h-12 bg-gray-800 dark:bg-gray-300 rounded-lg"></div>
            </div>
            
            {/* Status Colors */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800 dark:text-white">Status</h3>
              <div className="w-full h-12 bg-green-500 rounded-lg"></div>
              <div className="w-full h-12 bg-blue-500 rounded-lg"></div>
              <div className="w-full h-12 bg-yellow-500 rounded-lg"></div>
              <div className="w-full h-12 bg-red-500 rounded-lg"></div>
            </div>
            
            {/* Gradients */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800 dark:text-white">Gradients</h3>
              <div className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg"></div>
              <div className="w-full h-12 bg-gradient-to-r from-blue-700 to-cyan-700 rounded-lg"></div>
              <div className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg"></div>
              <div className="w-full h-12 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Play className="w-6 h-6 text-blue-600" />
            Buttons
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Primary Buttons */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800 dark:text-white">Primary</h3>
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium">
                Gradient Button
              </button>
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Solid Button
              </button>
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg opacity-50 cursor-not-allowed font-medium">
                Disabled Button
              </button>
            </div>
            
            {/* Secondary Buttons */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800 dark:text-white">Secondary</h3>
              <button className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                Border Button
              </button>
              <button className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                Gray Button
              </button>
              <button className="w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium">
                Text Button
              </button>
            </div>
            
            {/* Icon Buttons */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800 dark:text-white">With Icons</h3>
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Button
              </button>
              <button className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Success Button
              </button>
              <button className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Button
              </button>
            </div>
          </div>
        </div>

        {/* Icon Buttons & Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Icon Buttons & Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Round Icon Buttons */}
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white mb-3">Round Icon Buttons</h3>
              <div className="flex gap-3 flex-wrap">
                <button className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg">
                  <Play size={20} />
                </button>
                <button className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Pause size={20} />
                </button>
                <button className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  <User size={20} />
                </button>
                <button className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Square Icon Buttons */}
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white mb-3">Square Icon Buttons</h3>
              <div className="flex gap-3 flex-wrap">
                <button className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Upload size={20} />
                </button>
                <button className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  <Eye size={20} />
                </button>
                <button className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                  <Copy size={20} />
                </button>
                <button className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors">
                  <Crown size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Elements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            Form Elements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text here"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Dropdown
                </label>
                <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Textarea
                </label>
                <textarea
                  placeholder="Enter longer text here"
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Checkboxes & Radio
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="checkbox1"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="checkbox1" className="text-sm text-gray-700 dark:text-gray-300">
                    Checkbox option
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="radio1"
                    name="radio-group"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="radio1" className="text-sm text-gray-700 dark:text-gray-300">
                    Radio option
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards & Containers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Image className="w-6 h-6 text-blue-600" />
            Cards & Containers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Basic Card */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Basic Card</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Simple card with gray background
              </p>
            </div>
            
            {/* Highlighted Card */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 transition-colors">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Highlighted Card</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Card with blue gradient background
              </p>
            </div>
            
            {/* Status Card */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors">
              <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Success Card</h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Card with success styling
              </p>
            </div>
          </div>
        </div>

        {/* Alerts & Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
            Alerts & Messages
          </h2>
          
          <div className="space-y-4">
            {/* Success Alert */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                <span className="font-medium">Success!</span>
              </div>
              <p className="mt-1">This is a success message with green styling.</p>
            </div>
            
            {/* Error Alert */}
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span className="font-medium">Error!</span>
              </div>
              <p className="mt-1">This is an error message with red styling.</p>
            </div>
            
            {/* Info Alert */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
              <div className="flex items-center gap-2">
                <Info size={16} />
                <span className="font-medium">Information</span>
              </div>
              <p className="mt-1">This is an informational message with blue styling.</p>
            </div>
            
            {/* Warning Alert */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span className="font-medium">Warning</span>
              </div>
              <p className="mt-1">This is a warning message with yellow styling.</p>
            </div>
          </div>
        </div>

        {/* Icons Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-blue-600" />
            Icon Collection
          </h2>
          
          <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
            {[
              Upload, Music, Play, Pause, Settings, User, Share2, Eye, Trash2,
              Crown, Star, Heart, CheckCircle, AlertTriangle, Info, X, Copy,
              Mail, Lock, Calendar, Clock, MessageSquare, Image, Video
            ].map((Icon, index) => (
              <div key={index} className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{Icon.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading States */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Loading States
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading spinner</p>
            </div>
            
            <div className="text-center">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-4">Skeleton loading</p>
            </div>
            
            <div className="text-center">
              <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg opacity-50 cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 mx-auto">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </button>
              <p className="text-gray-600 dark:text-gray-300 mt-4">Button loading state</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>UITest Page - Not linked from main application</p>
          <p className="mt-1">Access via: /uitest</p>
        </div>
      </div>
    </div>
  );
}