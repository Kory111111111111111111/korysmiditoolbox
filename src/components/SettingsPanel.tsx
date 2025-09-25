import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { XMarkIcon, MoonIcon, CogIcon, ShieldCheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-150" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="elevated-card max-w-lg w-full max-h-[90vh] overflow-y-auto bg-gray-800/90 backdrop-blur-md border border-gray-700/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CogIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-h4 text-white font-semibold">Settings</h2>
                <p className="text-body-sm text-gray-400">Configure your preferences</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* API Key Management */}
            <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                <h3 className="text-h6 text-white font-semibold">Google Gemini API Key</h3>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <Button
                  onClick={handleSaveApiKey}
                  variant="default"
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  disabled={!apiKey}
                >
                  Save API Key
                </Button>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-body-sm text-blue-400 flex items-start space-x-2">
                    <InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Your API key is stored securely in your browser and is never sent to our servers.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Editor Preferences */}
            <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-h6 text-white font-semibold mb-4">Editor Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-body-sm text-gray-300">Snap to Scale</div>
                    <div className="text-caption text-gray-400">Notes automatically snap to selected scale</div>
                  </div>
                  <button
                    onClick={() => updateSettings({ snapToScale: !(state.settings.snapToScale ?? true) })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      state.settings.snapToScale ?? true 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                        : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        state.settings.snapToScale ?? true ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-body-sm text-gray-300">Snap to Grid</div>
                    <div className="text-caption text-gray-400">Notes snap to timing grid</div>
                  </div>
                  <button
                    onClick={() => updateSettings({ snapToGrid: !(state.settings.snapToGrid ?? true) })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      state.settings.snapToGrid ?? true 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                        : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        state.settings.snapToGrid ?? true ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-h6 text-white font-semibold mb-4">Appearance</h3>
              <Button
                onClick={() => {}}
                variant="secondary"
                size="lg"
                className="w-full cursor-not-allowed opacity-60 bg-gray-700/50"
                leftIcon={<MoonIcon className="w-5 h-5" />}
              >
                Dark Theme (Enforced)
              </Button>
            </div>

            {/* Data Management */}
            <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-h6 text-white font-semibold mb-4">Data Management</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowConfirmClear(true)}
                  variant="warning"
                  size="lg"
                  className="w-full"
                >
                  Clear Current Session
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="elevated-card p-6 max-w-sm w-full bg-gray-800/90">
              <h3 className="text-h5 text-white font-semibold mb-4">Clear Session</h3>
              <p className="text-body text-gray-300 mb-6">
                Are you sure? This will remove all notes from the current session.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowConfirmClear(false)}
                  variant="outline"
                  size="lg"
                  className="flex-1 border-gray-600 hover:border-gray-500"
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="elevated-card p-6 max-w-sm w-full bg-gray-800/90">
              <h3 className="text-h5 text-white font-semibold mb-4">Factory Reset</h3>
              <p className="text-body text-gray-300 mb-6">
                This will clear all data including your API key, settings, and saved notes. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowConfirmReset(false)}
                  variant="outline"
                  size="lg"
                  className="flex-1 border-gray-600 hover:border-gray-500"
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