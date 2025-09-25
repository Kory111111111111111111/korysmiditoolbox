import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { XMarkIcon, MoonIcon } from '@heroicons/react/24/outline';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { state, updateSettings, clearNotes } = useApp();
  const [apiKey, setApiKey] = useState(state.settings.apiKey);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSaveApiKey = () => {
    updateSettings({ apiKey });
    onClose();
  };

  // Theme is enforced to dark; toggle disabled

  const handleClearSession = () => {
    clearNotes();
    setShowConfirmClear(false);
    onClose();
  };

  const handleFactoryReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-150" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-scale-in-150">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Settings
              </h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              aria-label="Close settings"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* API Key Management */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Google Gemini API Key
              </h3>
              <div className="space-y-3">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={handleSaveApiKey}
                  variant="default"
                  size="lg"
                  className="w-full"
                  disabled={!apiKey}
                >
                  Save API Key
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your API key is stored securely in your browser and is never sent to our servers.
                </p>
              </div>
            </div>

            {/* Theme Switcher */}
            {/* Theme Switcher (disabled — app is dark-only) */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Theme
              </h3>
              <Button
                onClick={() => {}}
                variant="secondary"
                size="lg"
                className="w-full cursor-not-allowed opacity-60"
                leftIcon={<MoonIcon className="w-5 h-5" />}
              >
                Dark theme is enforced
              </Button>
            </div>

            {/* Editor Snapping moved to the piano roll header */}

            {/* Application Data */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Application Data
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowConfirmClear(true)}
                  variant="warning"
                  size="lg"
                  className="w-full"
                >
                  Clear Session
                </Button>
                <Button
                  onClick={() => setShowConfirmReset(true)}
                  variant="danger"
                  size="lg"
                  className="w-full"
                >
                  Factory Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialogs */}
        {showConfirmClear && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Clear Session
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure? This will remove all notes from the piano roll.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowConfirmClear(false)}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleClearSession}
                  variant="warning"
                  size="lg"
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {showConfirmReset && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Factory Reset
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure? This will clear all data from Local Storage, including your API key, theme preference, and any saved notes.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowConfirmReset(false)}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFactoryReset}
                  variant="danger"
                  size="lg"
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
