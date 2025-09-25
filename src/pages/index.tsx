import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ToastProvider, useToastActions } from '@/components/ui/Toast';
import PianoRoll from '@/components/PianoRoll';
import SettingsPanel from '@/components/SettingsPanel';
import { Header } from '@/components/layout/Header';
import { Main } from '@/components/layout/Main';
import { Footer } from '@/components/layout/Footer';
import { ControlPanel } from '@/components/layout/ControlPanel';
import { GeminiService } from '@/services/geminiService';
import { AudioService } from '@/services/audioService';
import { MidiExportService } from '@/services/midiExportService';
import { getDefaultProgression } from '@/utils/defaultProgression';
import { PianoRollDimensions, RootNote, ScaleType } from '@/types';

function MainApp() {
  const { state, dispatch, clearNotes, updateSettings } = useApp();
  const { success, error } = useToastActions();
  const [showSettings, setShowSettings] = useState(false);
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [volume, setVolume] = useState(100);
  const [bpm, setBpm] = useState(120);
  
  const geminiService = useRef<GeminiService | null>(null);
  const audioService = useRef<AudioService | null>(null);
  const midiExportService = useRef<MidiExportService | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Initialize services
  useEffect(() => {
    if (state.settings.apiKey) {
      geminiService.current = new GeminiService(state.settings.apiKey);
    }
    audioService.current = new AudioService();
    midiExportService.current = new MidiExportService();
  }, [state.settings.apiKey]);

  // Load default progression if no notes exist
  useEffect(() => {
    if (state.notes.length === 0) {
      const defaultNotes = getDefaultProgression();
      defaultNotes.forEach(note => {
        dispatch({ type: 'ADD_NOTE', payload: note });
      });
    }
  }, [state.notes.length, dispatch]);

  // Force dark theme across the app
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleGenerate = async () => {
    if (!state.settings.apiKey) {
      error('Please set your Gemini API key in the settings panel.', 'API Key Required');
      return;
    }

    if (!geminiService.current) {
      geminiService.current = new GeminiService(state.settings.apiKey);
    }

    setIsGenerating(true);
    try {
      const newNotes = await geminiService.current.generateChordProgression(
        state.rootNote as RootNote,
        state.scaleType as ScaleType,
        4
      );
      
      // Clear existing notes and add new ones
      clearNotes();
      newNotes.forEach(note => {
        dispatch({ type: 'ADD_NOTE', payload: note });
      });
      
      success('Chord progression generated successfully!');
    } catch (err) {
      console.error('Generation error:', err);
      error(err instanceof Error ? err.message : 'Failed to generate chord progression.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMIDI = async () => {
    if (!midiExportService.current) {
      midiExportService.current = new MidiExportService();
    }

    try {
      const midiBlob = midiExportService.current.exportMIDI(state.notes);
      const url = URL.createObjectURL(midiBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chord-progression-${Date.now()}.mid`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      success('MIDI file downloaded successfully!');
    } catch (err) {
      console.error('MIDI export error:', err);
      error('Failed to export MIDI file.');
    }
  };

  const handleExportWAV = async () => {
    if (!audioService.current) {
      audioService.current = new AudioService();
    }

    try {
      success('Preparing your WAV file...', 'Export Started');
      const wavBlob = await audioService.current.exportWAV(state.notes);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chord-progression-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      success('WAV file downloaded successfully!');
    } catch (err) {
      console.error('WAV export error:', err);
      error('Failed to export WAV file.');
    }
  };

  const handlePlay = () => {
    dispatch({ type: 'SET_PLAYING', payload: true });
  };

  const handlePause = () => {
    dispatch({ type: 'SET_PLAYING', payload: false });
  };

  const handleStop = () => {
    dispatch({ type: 'SET_PLAYING', payload: false });
    dispatch({ type: 'SET_CURRENT_TIME', payload: 0 });
  };

  // Simple playback clock updating currentTime in context
  useEffect(() => {
    if (!state.isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }

    const secondsPerBeat = 60 / bpm; // aligns visuals if bpm=120
    const update = (timestamp: number) => {
      if (lastTsRef.current == null) {
        lastTsRef.current = timestamp;
      }
      const deltaMs = timestamp - lastTsRef.current;
      lastTsRef.current = timestamp;
      const deltaSec = deltaMs / 1000;
      dispatch({ type: 'SET_CURRENT_TIME', payload: state.currentTime + deltaSec });
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [state.isPlaying, bpm, state.currentTime, dispatch]);

  const pianoRollDimensions: PianoRollDimensions = {
    width: 1000,
    height: 400,
    noteHeight: 16,
    beatWidth: 50
  };

  const keySignature = `${state.rootNote} ${state.scaleType}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header 
        onExportMIDI={handleExportMIDI}
        onExportWAV={handleExportWAV}
      />

      <Main 
        notesCount={state.notes.length}
        onOpenPianoRoll={() => setShowPianoRoll(true)}
      >
        <ControlPanel
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onExportMIDI={handleExportMIDI}
          onExportWAV={handleExportWAV}
          onToggleSettings={() => setShowSettings(true)}
        />
      </Main>

      <Footer
        isPlaying={state.isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        volume={volume}
        onVolumeChange={setVolume}
        bpm={bpm}
        onBpmChange={setBpm}
        keySignature={keySignature}
      />

      {/* Piano Roll Modal */}
      {showPianoRoll && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-150" role="dialog" aria-modal="true" aria-label="Piano Roll">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-gray-700 animate-scale-in-150">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 bg-gray-800/90">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <h2 className="text-h4 text-white">Piano Roll Editor</h2>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2 text-body-sm text-gray-400">
                    <span>•</span>
                    <span>Double-click to add notes</span>
                    <span>•</span>
                    <span>Drag to move</span>
                    <span>•</span>
                    <span>Resize edges</span>
                  </div>
                  {/* Quick Toggles */}
                  <div className="flex items-center space-x-4 ml-2">
                    <label className="flex items-center space-x-2 text-xs text-gray-300">
                      <span>Scale</span>
                      <button
                        onClick={() => updateSettings({ snapToScale: !(state.settings.snapToScale ?? true) })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${state.settings.snapToScale ?? true ? 'bg-blue-600' : 'bg-gray-600'}`}
                        aria-label="Toggle Snap to Scale"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${state.settings.snapToScale ?? true ? 'translate-x-4' : 'translate-x-1'}`}
                        />
                      </button>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-gray-300">
                      <span>Grid</span>
                      <button
                        onClick={() => updateSettings({ snapToGrid: !(state.settings.snapToGrid ?? true) })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${state.settings.snapToGrid ?? true ? 'bg-blue-600' : 'bg-gray-600'}`}
                        aria-label="Toggle Snap to Grid"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${state.settings.snapToGrid ?? true ? 'translate-x-4' : 'translate-x-1'}`}
                        />
                      </button>
                    </label>
                    <span className="text-[11px] text-gray-400">Alt: chromatic • Shift: fine grid</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-body-sm flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => setShowPianoRoll(false)}
                    aria-label="Close piano roll"
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Piano Roll Content */}
            <div className="relative bg-gray-900">
              <PianoRoll dimensions={pianoRollDimensions} />
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/90">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-body-sm text-gray-400">
                  <span>Notes: {state.notes.length}</span>
                  <span>•</span>
                  <span>Range: C4 - C6</span>
                  <span>•</span>
                  <span>Bars: 8</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-body-sm">Clear All</button>
                  <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-body-sm">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <ToastProvider>
      <MainApp />
      </ToastProvider>
    </AppProvider>
  );
}
