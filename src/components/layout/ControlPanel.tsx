import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { ROOT_NOTES, SCALE_TYPES } from '@/utils/midiUtils';
import { RootNote, ScaleType } from '@/types';
import { 
  Cog6ToothIcon,
  MusicalNoteIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface ControlPanelProps {
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  onExportMIDI: () => void;
  onExportWAV: () => void;
  onToggleSettings: () => void;
}

export function ControlPanel({ 
  onGenerate, 
  isGenerating, 
  onExportMIDI, 
  onExportWAV, 
  onToggleSettings 
}: ControlPanelProps) {
  const { state, setRootNote, setScaleType } = useApp();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const handleRootNoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRootNote(e.target.value as RootNote);
  };

  const handleScaleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScaleType(e.target.value as ScaleType);
  };

  const handleExportClick = () => {
    setShowExportMenu(!showExportMenu);
  };

  const handleExportMIDI = () => {
    setShowExportMenu(false);
    onExportMIDI();
  };

  const handleExportWAV = () => {
    setShowExportMenu(false);
    onExportWAV();
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!showExportMenu) return;
    const onDocClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExportMenu(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showExportMenu]);

  return (
    <div className="space-y-6">
      {/* Musical Parameters */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-soft">
        <h2 className="text-h6 text-white mb-4 flex items-center space-x-2">
          <MusicalNoteIcon className="w-5 h-5 text-indigo-400" />
          <span>Musical Parameters</span>
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="rootNote" className="text-label text-gray-400 block mb-2">
              Root Note
            </label>
            <select
              id="rootNote"
              value={state.rootNote}
              onChange={handleRootNoteChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-body-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {ROOT_NOTES.map(note => (
                <option key={note} value={note}>{note}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="scaleType" className="text-label text-gray-400 block mb-2">
              Scale Type
            </label>
            <select
              id="scaleType"
              value={state.scaleType}
              onChange={handleScaleTypeChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-body-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {SCALE_TYPES.map(scale => (
                <option key={scale} value={scale}>{scale}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-soft">
        <h2 className="text-h6 text-white mb-4">Actions</h2>
        
        <div className="space-y-3">
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !state.settings.apiKey}
            loading={isGenerating}
            variant="default"
            size="lg"
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Progression'}
          </Button>

          <div className="relative" ref={exportMenuRef}>
            <Button
              onClick={handleExportClick}
              variant="success"
              size="lg"
              className="w-full"
              rightIcon={<ChevronDownIcon className="w-4 h-4" />}
            >
              Export
            </Button>

            {showExportMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-10 overflow-hidden animate-scale-in-150">
                <button
                  onClick={handleExportMIDI}
                  className="w-full text-left px-4 py-3 text-body-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                >
                  <MusicalNoteIcon className="w-4 h-4" />
                  <span>Export MIDI</span>
                </button>
                <button
                  onClick={handleExportWAV}
                  className="w-full text-left px-4 py-3 text-body-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Export WAV</span>
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={onToggleSettings}
            variant="ghost"
            size="lg"
            className="w-full"
            leftIcon={<Cog6ToothIcon className="w-4 h-4" />}
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-soft">
        <h2 className="text-h6 text-white mb-4">Status</h2>
        
        <div className="space-y-2 text-body-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">API Key:</span>
            <span className={state.settings.apiKey ? 'text-green-400' : 'text-red-400'}>
              {state.settings.apiKey ? 'Configured' : 'Not Set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Notes:</span>
            <span className="text-white">{state.notes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Key:</span>
            <span className="text-white">{state.rootNote} {state.scaleType}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
