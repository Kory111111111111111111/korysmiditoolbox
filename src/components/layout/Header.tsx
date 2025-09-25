import React from 'react';
import { Button } from '@/components/ui/Button';
import { UndoRedoControls } from '@/components/UndoRedoControls';
import { 
  ShareIcon, 
  ArrowDownTrayIcon,
  MusicalNoteIcon,
  SparklesIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onExportMIDI: () => void;
  onExportWAV: () => void;
  onShare?: () => void;
}

export function Header({ onExportMIDI, onExportWAV, onShare }: HeaderProps) {
  return (
    <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 px-4 sm:px-6 py-4 relative" role="banner">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3 sm:space-x-4 animate-slide-in-left min-w-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-xl blur-md" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                <MusicalNoteIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-h6 sm:text-h5 text-white font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
                  <span className="hidden sm:inline">Kory&apos;s MIDI Toolbox</span>
                  <span className="sm:hidden">MIDI Toolbox</span>
                </h1>
                <div className="hidden sm:flex items-center space-x-1">
                  <SparklesIcon className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <BoltIcon className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <p className="text-caption text-gray-400">
                  <span className="hidden sm:inline">v1.0 • AI-Powered</span>
                  <span className="sm:hidden">v1.0</span>
                </p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-caption text-green-400 hidden sm:inline">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <nav className="flex items-center space-x-2 sm:space-x-3 animate-slide-in-right" role="navigation" aria-label="Main actions">
          {/* Undo/Redo Controls */}
          <UndoRedoControls className="hidden sm:flex" />
          
          <div className="hidden sm:block h-6 w-px bg-gray-700" aria-hidden="true" />
          
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              leftIcon={<ShareIcon className="w-4 h-4" />}
              className="hover:bg-gray-800/50 text-gray-300 hover:text-white hidden sm:flex"
              aria-label="Share composition"
            >
              Share
            </Button>
          )}
          
          <div className="hidden sm:block h-6 w-px bg-gray-700" aria-hidden="true" />
          
          <Button
            variant="success"
            size="sm"
            onClick={onExportWAV}
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl"
            aria-label="Export as WAV audio file"
          >
            <span className="hidden sm:inline">Export</span> WAV
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={onExportMIDI}
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
            aria-label="Export as MIDI file"
          >
            <span className="hidden sm:inline">Export</span> MIDI
          </Button>
        </nav>
      </div>
    </header>
  );
}
