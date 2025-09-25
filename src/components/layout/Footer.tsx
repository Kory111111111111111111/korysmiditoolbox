import React from 'react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { CompactAudioVisualizer } from '@/components/AudioVisualizer';
import { 
  SpeakerWaveIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  MusicalNoteIcon,
  AdjustmentsHorizontalIcon,
  SpeakerXMarkIcon
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
  onOpenMixer?: () => void;
}

export function Footer({ 
  isPlaying, 
  onPlay, 
  onPause, 
  onStop, 
  volume: _volume, 
  onVolumeChange, 
  bpm: _bpm, 
  onBpmChange,
  keySignature,
  onOpenMixer
}: FooterProps) {
  const { state, setTempo, setMetronome, setLoop, setMasterVolume } = useApp();
  return (
    <footer className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800/50 px-4 sm:px-6 py-3 sm:py-4 relative" role="contentinfo">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0">
          {/* Volume Control */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 order-2 lg:order-1">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-800/30 rounded-xl px-3 sm:px-4 py-2 backdrop-blur-sm border border-gray-700/50">
              <button
                onClick={() => setMasterVolume(state.audio.masterVolume > 0 ? 0 : 80)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {state.audio.masterVolume === 0 ? (
                  <SpeakerXMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                ) : (
                  <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                )}
              </button>
              <span className="text-label text-gray-400 hidden sm:inline" aria-hidden="true">Volume</span>
              <div className="relative flex-1 min-w-[60px] sm:min-w-[80px] max-w-[100px] sm:max-w-[120px]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={state.audio.masterVolume}
                  onChange={(e) => {
                    const newVolume = Number(e.target.value);
                    setMasterVolume(newVolume);
                    onVolumeChange(newVolume);
                  }}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${state.audio.masterVolume}%, #374151 ${state.audio.masterVolume}%, #374151 100%)`
                  }}
                  aria-label={`Volume: ${state.audio.masterVolume}%`}
                />
              </div>
              <span className="text-caption text-gray-400 w-6 sm:w-8 text-right tabular-nums text-xs sm:text-sm" aria-hidden="true">{state.audio.masterVolume}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center space-x-3 sm:space-x-6 order-1 lg:order-2">
            {/* BPM Control */}
            <div className="flex items-center space-x-2 sm:space-x-4 bg-gray-800/30 rounded-xl px-3 sm:px-4 py-2 backdrop-blur-sm border border-gray-700/50">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  const newBpm = Math.max(60, state.audio.tempo - 5);
                  setTempo(newBpm);
                  onBpmChange(newBpm);
                }}
                className="hover:bg-gray-700/50 text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8"
                aria-label="Decrease BPM"
              >
                <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              <div className="text-center min-w-[60px] sm:min-w-[80px]">
                <div className="text-body-sm sm:text-h6 text-white font-semibold tabular-nums">{state.audio.tempo}</div>
                <div className="text-caption text-gray-400 text-xs">BPM</div>
              </div>
              
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  const newBpm = Math.min(200, state.audio.tempo + 5);
                  setTempo(newBpm);
                  onBpmChange(newBpm);
                }}
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
                onClick={() => {
                  setTempo(120);
                  onBpmChange(120);
                }}
                className="hover:bg-gray-700/50 text-gray-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                title="Reset to 120 BPM"
                aria-label="Reset BPM to 120"
              >
                <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              {/* Enhanced controls */}
              <Button
                variant={state.audio.metronome ? "default" : "ghost"}
                size="icon"
                onClick={() => setMetronome(!state.audio.metronome)}
                className={`w-8 h-8 sm:w-10 sm:h-10 ${
                  state.audio.metronome 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
                }`}
                title="Toggle Metronome"
                aria-label="Toggle Metronome"
              >
                <MusicalNoteIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              
              <Button
                variant={state.audio.loop ? "default" : "ghost"}
                size="icon"
                onClick={() => setLoop(!state.audio.loop)}
                className={`w-8 h-8 sm:w-10 sm:h-10 ${
                  state.audio.loop 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
                }`}
                title="Toggle Loop"
                aria-label="Toggle Loop"
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
            {/* Mixer Button */}
            {onOpenMixer && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenMixer}
                className="hidden lg:flex items-center space-x-2 bg-gray-800/30 border-gray-600 hover:border-indigo-500 hover:bg-indigo-500/10"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                <span>Mixer</span>
              </Button>
            )}
            
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
              <div className="h-4 w-px bg-gray-700" aria-hidden="true" />
              <CompactAudioVisualizer className="opacity-80" />
              {state.audio.loop && (
                <>
                  <div className="h-4 w-px bg-gray-700" aria-hidden="true" />
                  <div className="flex items-center space-x-1 text-caption text-purple-400">
                    <ArrowPathIcon className="w-3 h-3" aria-hidden="true" />
                    <span>Loop</span>
                  </div>
                </>
              )}
              {state.audio.metronome && (
                <>
                  <div className="h-4 w-px bg-gray-700" aria-hidden="true" />
                  <div className="flex items-center space-x-1 text-caption text-green-400">
                    <MusicalNoteIcon className="w-3 h-3" aria-hidden="true" />
                    <span>Click</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
