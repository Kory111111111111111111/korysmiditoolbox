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
    <footer className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800/50 px-4 sm:px-6 py-3 sm:py-4 relative" role="contentinfo">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0">
          {/* Volume Control */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 order-2 lg:order-1">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-800/30 rounded-xl px-3 sm:px-4 py-2 backdrop-blur-sm border border-gray-700/50">
              <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-label text-gray-400 hidden sm:inline" aria-hidden="true">Volume</span>
              <div className="relative flex-1 min-w-[60px] sm:min-w-[80px] max-w-[100px] sm:max-w-[120px]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${volume}%, #374151 ${volume}%, #374151 100%)`
                  }}
                  aria-label={`Volume: ${volume}%`}
                />
              </div>
              <span className="text-caption text-gray-400 w-6 sm:w-8 text-right tabular-nums text-xs sm:text-sm" aria-hidden="true">{volume}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center space-x-3 sm:space-x-6 order-1 lg:order-2">
            {/* BPM Control */}
            <div className="flex items-center space-x-2 sm:space-x-4 bg-gray-800/30 rounded-xl px-3 sm:px-4 py-2 backdrop-blur-sm border border-gray-700/50">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onBpmChange(Math.max(60, bpm - 5))}
                className="hover:bg-gray-700/50 text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8"
                aria-label="Decrease BPM"
              >
                <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              <div className="text-center min-w-[60px] sm:min-w-[80px]">
                <div className="text-body-sm sm:text-h6 text-white font-semibold tabular-nums">{bpm}</div>
                <div className="text-caption text-gray-400 text-xs">BPM</div>
              </div>
              
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onBpmChange(Math.min(200, bpm + 5))}
                className="hover:bg-gray-700/50 text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8"
                aria-label="Increase BPM"
              >
                <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Main Transport */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-800/50 rounded-xl p-1 sm:p-2 backdrop-blur-sm border border-gray-700/50" role="group" aria-label="Playback controls">
              <Button
                variant="ghost"
                size="icon"
                onClick={onStop}
                className="hover:bg-gray-700/50 text-gray-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                aria-label="Stop playback"
              >
                <StopIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              <Button
                variant={isPlaying ? "default" : "default"}
                size="icon"
                onClick={isPlaying ? onPause : onPlay}
                className={`w-10 h-10 sm:w-12 sm:h-12 ${
                  isPlaying 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                } hover:shadow-xl`}
                aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
              >
                {isPlaying ? (
                  <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onBpmChange(120)}
                className="hover:bg-gray-700/50 text-gray-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                title="Reset to 120 BPM"
                aria-label="Reset BPM to 120"
              >
                <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Key Signature */}
            <div className="bg-gray-800/30 rounded-xl px-3 sm:px-4 py-2 backdrop-blur-sm border border-gray-700/50">
              <div className="text-center min-w-[50px] sm:min-w-[60px]">
                <div className="text-body-sm sm:text-h6 text-white font-semibold">{keySignature}</div>
                <div className="text-caption text-gray-400 text-xs">Key</div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-3 min-w-0 order-3 lg:order-3">
            <div className="hidden lg:flex items-center space-x-4 bg-gray-800/30 rounded-xl px-4 py-2 backdrop-blur-sm border border-gray-700/50">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} aria-hidden="true" />
                <span className="text-caption text-gray-400">
                  {isPlaying ? 'Playing' : 'Stopped'}
                </span>
              </div>
              <div className="h-4 w-px bg-gray-700" aria-hidden="true" />
              <div className="flex items-center space-x-1 text-caption text-gray-400">
                <MusicalNoteIcon className="w-3 h-3" aria-hidden="true" />
                <span>4/4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
