import React from 'react';
import { Button } from '@/components/ui/Button';
import { 
  SpeakerWaveIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';

interface FooterProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  keySignature: string;
}

export function Footer({ 
  isPlaying, 
  onPlay, 
  onPause, 
  onStop, 
  volume, 
  onVolumeChange, 
  bpm, 
  onBpmChange,
  keySignature 
}: FooterProps) {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Volume Control */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <SpeakerWaveIcon className="w-5 h-5 text-gray-400" />
              <span className="text-label text-gray-400">Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-caption text-gray-400 w-8">{volume}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onBpmChange(Math.max(60, bpm - 5))}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <div className="text-h6 text-white">{bpm} BPM</div>
                <div className="text-caption text-gray-400">{keySignature}</div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onBpmChange(Math.min(200, bpm + 5))}
              >
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onStop}
              >
                <StopIcon className="w-4 h-4" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                onClick={isPlaying ? onPause : onPlay}
              >
                {isPlaying ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onBpmChange(120)}
              >
                <ArrowPathIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Additional Controls */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon">
              <MusicalNoteIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MusicalNoteIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MusicalNoteIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
