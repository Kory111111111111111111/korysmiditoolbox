import React from 'react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { ROOT_NOTES, SCALE_TYPES } from '@/utils/midiUtils';
import { RootNote, ScaleType } from '@/types';
import { 
  SparklesIcon, 
  ArrowDownTrayIcon, 
  CogIcon,
  PlayIcon,
  ChevronDownIcon,
  MusicalNoteIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ControlPanelProps {
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  onExportMIDI: () => void;
  onExportWAV: () => void;
  onToggleSettings: () => void;
  onShowChordTemplates?: () => void;
}

export function ControlPanel({
  onGenerate,
  isGenerating,
  onExportMIDI,
  onExportWAV,
  onToggleSettings,
  onShowChordTemplates
}: ControlPanelProps) {
  const { state, setRootNote, setScaleType } = useApp();

  const handleRootNoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRootNote(e.target.value as RootNote);
  };

  const handleScaleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScaleType(e.target.value as ScaleType);
  };

  return (
    <div className="space-y-6">
      {/* Musical Parameters Card */}
      <div className="elevated-card p-6 border border-gray-800/50 bg-gray-800/20 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-h6 text-white font-semibold">Musical Parameters</h3>
            <p className="text-caption text-gray-400">Configure your composition</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Root Note Selection */}
          <div className="space-y-2">
            <label htmlFor="rootNote" className="text-body-sm font-medium text-gray-300 flex items-center space-x-2">
              <MusicalNoteIcon className="w-4 h-4 text-indigo-400" />
              <span>Root Note</span>
            </label>
            <div className="relative">
              <select
                id="rootNote"
                value={state.rootNote}
                onChange={handleRootNoteChange}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium appearance-none cursor-pointer hover:bg-gray-900/70 transition-colors"
              >
                {ROOT_NOTES.map(note => (
                  <option key={note} value={note} className="bg-gray-800">
                    {note}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Scale Type Selection */}
          <div className="space-y-2">
            <label htmlFor="scaleType" className="text-body-sm font-medium text-gray-300 flex items-center space-x-2">
              <SparklesIcon className="w-4 h-4 text-purple-400" />
              <span>Scale Type</span>
            </label>
            <div className="relative">
              <select
                id="scaleType"
                value={state.scaleType}
                onChange={handleScaleTypeChange}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium appearance-none cursor-pointer hover:bg-gray-900/70 transition-colors"
              >
                {SCALE_TYPES.map(scale => (
                  <option key={scale} value={scale} className="bg-gray-800">
                    {scale}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Current Key Display */}
          <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-700/50">
            <div className="text-caption text-gray-400 mb-1">Current Key</div>
            <div className="text-h6 text-white font-semibold">
              {state.rootNote} {state.scaleType}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Card */}
      <div className="elevated-card p-6 border border-gray-800/50 bg-gray-800/20 backdrop-blur-sm space-y-4">
        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !state.settings.apiKey}
          variant="default"
          size="lg"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 shadow-lg hover:shadow-xl text-white font-semibold"
          leftIcon={
            isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )
          }
        >
          {isGenerating ? 'Generating...' : 'Generate with AI'}
        </Button>

        {!state.settings.apiKey && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-body-sm text-yellow-400 flex items-center space-x-2">
              <CogIcon className="w-4 h-4" />
              <span>API key required for generation</span>
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {onShowChordTemplates && (
          <>
            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              <span className="text-caption text-gray-400">Quick Actions</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onShowChordTemplates}
                variant="outline"
                size="default"
                leftIcon={<BookOpenIcon className="w-4 h-4" />}
                className="border-gray-600 hover:border-purple-500 hover:bg-purple-500/10 text-gray-300 hover:text-purple-300"
              >
                Templates
              </Button>
              <Button
                variant="outline"
                size="default"
                leftIcon={<ClockIcon className="w-4 h-4" />}
                className="border-gray-600 hover:border-blue-500 hover:bg-blue-500/10 text-gray-300 hover:text-blue-300"
              >
                History
              </Button>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
          <span className="text-caption text-gray-400">Export</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onExportMIDI}
            variant="outline"
            size="default"
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            className="border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 text-gray-300 hover:text-white"
          >
            MIDI
          </Button>
          <Button
            onClick={onExportWAV}
            variant="success"
            size="default"
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            WAV
          </Button>
        </div>

        {/* Settings Button */}
        <Button
          onClick={onToggleSettings}
          variant="ghost"
          size="default"
          leftIcon={<CogIcon className="w-4 h-4" />}
          className="w-full text-gray-400 hover:text-white hover:bg-gray-700/50"
        >
          Settings & Preferences
        </Button>
      </div>

      {/* Tips Card */}
      <div className="elevated-card p-4 border border-gray-800/50 bg-gray-800/10 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <PlayIcon className="w-3 h-3 text-blue-400" />
          </div>
          <div>
            <h4 className="text-body-sm font-medium text-gray-300 mb-1">Quick Tip</h4>
            <p className="text-caption text-gray-400 leading-relaxed">
              Try different scales like Dorian or Mixolydian for unique chord progressions. Each scale creates a different mood and character.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}