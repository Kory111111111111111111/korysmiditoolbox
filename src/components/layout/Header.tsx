import React from 'react';
import { Button } from '@/components/ui/Button';
import { 
  ShareIcon, 
  ArrowDownTrayIcon,
  MusicalNoteIcon 
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onExportMIDI: () => void;
  onExportWAV: () => void;
  onShare?: () => void;
}

export function Header({ onExportMIDI, onExportWAV, onShare }: HeaderProps) {
  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <MusicalNoteIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-h6 text-white font-semibold">Kory&apos;s MIDI Toolbox</h1>
              <p className="text-caption text-gray-400">v1.0</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              leftIcon={<ShareIcon className="w-4 h-4" />}
            >
              Share
            </Button>
          )}
          
          <Button
            variant="success"
            size="sm"
            onClick={onExportWAV}
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
          >
            Export WAV
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={onExportMIDI}
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
          >
            Export MIDI
          </Button>
        </div>
      </div>
    </header>
  );
}
