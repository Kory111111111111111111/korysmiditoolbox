import React from 'react';
import { useApp } from '@/context/AppContext';
import { AudioSectionType } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  SpeakerWaveIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';

interface TrackControlsProps {
  sectionId: AudioSectionType;
  title: string;
  color: string;
  icon: React.ReactNode;
}

function TrackControls({ sectionId, title, color, icon }: TrackControlsProps) {
  const { state, setTrackVolume, setTrackPan, setTrackMute, setTrackSolo } = useApp();
  const track = state.audio.tracks[sectionId];
  const audioLevel = state.audio.audioLevels[sectionId] || 0;
  const hasSoloedTracks = Object.values(state.audio.tracks).some(t => t.soloed);

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 backdrop-blur-sm">
      {/* Track Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-md ${color}`}>
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{title}</h4>
            <p className="text-xs text-gray-400">{sectionId}</p>
          </div>
        </div>
        
        {/* Level Meter */}
        <div className="w-3 h-12 bg-gray-700 rounded-full relative overflow-hidden">
          <div 
            className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-75 ${color.replace('bg-', 'bg-opacity-80 bg-')}`}
            style={{ height: `${Math.min(100, audioLevel * 100)}%` }}
          />
          <div className="absolute inset-0 flex flex-col justify-between p-0.5">
            <div className="w-full h-px bg-red-500 opacity-60" />
            <div className="w-full h-px bg-yellow-500 opacity-40" />
            <div className="w-full h-px bg-green-500 opacity-40" />
          </div>
        </div>
      </div>

      {/* Solo/Mute Controls */}
      <div className="flex space-x-1 mb-3">
        <Button
          variant={track.soloed ? "default" : "outline"}
          size="sm"
          onClick={() => setTrackSolo(sectionId, !track.soloed)}
          className={`flex-1 text-xs ${
            track.soloed 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'border-gray-600 hover:border-yellow-500 hover:bg-yellow-500/10'
          }`}
        >
          S
        </Button>
        <Button
          variant={track.muted ? "default" : "outline"}
          size="sm"
          onClick={() => setTrackMute(sectionId, !track.muted)}
          className={`flex-1 text-xs ${
            track.muted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'border-gray-600 hover:border-red-500 hover:bg-red-500/10'
          }`}
        >
          M
        </Button>
      </div>

      {/* Volume Control */}
      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Volume</label>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={track.volume}
            onChange={(e) => setTrackVolume(sectionId, Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{
              background: `linear-gradient(to right, ${color.replace('bg-', '#')} 0%, ${color.replace('bg-', '#')} ${track.volume}%, #374151 ${track.volume}%, #374151 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span className="font-medium text-white">{track.volume}</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Pan Control */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Pan</label>
        <div className="relative">
          <input
            type="range"
            min="-100"
            max="100"
            value={track.pan * 100}
            onChange={(e) => setTrackPan(sectionId, Number(e.target.value) / 100)}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>L</span>
            <span className="font-medium text-white">
              {track.pan === 0 ? 'C' : track.pan > 0 ? `R${Math.round(track.pan * 100)}` : `L${Math.round(Math.abs(track.pan) * 100)}`}
            </span>
            <span>R</span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-3 pt-3 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {track.muted ? 'Muted' : track.soloed ? 'Soloed' : hasSoloedTracks ? 'Inactive' : 'Active'}
          </span>
          <div className={`w-2 h-2 rounded-full ${
            track.muted 
              ? 'bg-red-500' 
              : track.soloed 
                ? 'bg-yellow-500' 
                : hasSoloedTracks 
                  ? 'bg-gray-500' 
                  : 'bg-green-500'
          }`} />
        </div>
      </div>
    </div>
  );
}

interface MixerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MixerPanel({ isOpen, onClose }: MixerPanelProps) {
  const { state, setMasterVolume, setTempo, setMetronome, setLoop } = useApp();

  if (!isOpen) return null;

  const sections = [
    {
      id: 'chord' as AudioSectionType,
      title: 'Chord',
      color: 'bg-green-600',
      icon: <MusicalNoteIcon className="w-4 h-4 text-white" />
    },
    {
      id: 'melody' as AudioSectionType,
      title: 'Melody',
      color: 'bg-blue-600',
      icon: <MusicalNoteIcon className="w-4 h-4 text-white" />
    },
    {
      id: 'bass' as AudioSectionType,
      title: 'Bass',
      color: 'bg-yellow-600',
      icon: <MusicalNoteIcon className="w-4 h-4 text-white" />
    },
    {
      id: 'arp' as AudioSectionType,
      title: 'Arp',
      color: 'bg-purple-600',
      icon: <MusicalNoteIcon className="w-4 h-4 text-white" />
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <SpeakerWaveIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Audio Mixer</h2>
                <p className="text-sm text-gray-400">Control volume, pan, and effects for each section</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {sections.map((section) => (
              <TrackControls
                key={section.id}
                sectionId={section.id}
                title={section.title}
                color={section.color}
                icon={section.icon}
              />
            ))}
          </div>

          {/* Master Section */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <SpeakerWaveIcon className="w-5 h-5 mr-2" />
              Master Controls
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Master Volume */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Master Volume</label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.audio.masterVolume}
                    onChange={(e) => setMasterVolume(Number(e.target.value))}
                    className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{
                      background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${state.audio.masterVolume}%, #374151 ${state.audio.masterVolume}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>0</span>
                    <span className="font-medium text-white">{state.audio.masterVolume}</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              {/* Tempo */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tempo (BPM)</label>
                <div className="relative">
                  <input
                    type="range"
                    min="60"
                    max="180"
                    value={state.audio.tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>60</span>
                    <span className="font-medium text-white">{state.audio.tempo}</span>
                    <span>180</span>
                  </div>
                </div>
              </div>

              {/* Transport Options */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Transport</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={state.audio.metronome}
                      onChange={(e) => setMetronome(e.target.checked)}
                      className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-300">Metronome</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={state.audio.loop}
                      onChange={(e) => setLoop(e.target.checked)}
                      className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-300">Loop</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}