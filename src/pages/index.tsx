import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ToastProvider, useToastActions } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import PianoRoll from '@/components/PianoRoll';
import SettingsPanel from '@/components/SettingsPanel';
import { ChordTemplates } from '@/components/ChordTemplates';
import { Header } from '@/components/layout/Header';
import { Main } from '@/components/layout/Main';
import { Footer } from '@/components/layout/Footer';
import { ControlPanel } from '@/components/layout/ControlPanel';
import { GeminiService } from '@/services/geminiService';
import { AudioService } from '@/services/audioService';
import { MidiExportService } from '@/services/midiExportService';
import { getDefaultProgression } from '@/utils/defaultProgression';
import { PianoRollDimensions, RootNote, ScaleType } from '@/types';
import { useKeyboardShortcuts, commonShortcuts, platformShortcut } from '@/hooks/useKeyboardShortcuts';
import { midiAnnouncements, FocusManager } from '@/utils/accessibility';

function MainApp() {
  const { state, dispatch, clearNotes, updateSettings, undo, redo, canUndo, canRedo, getUndoDescription, getRedoDescription } = useApp();
  const { success, error } = useToastActions();
  const [showSettings, setShowSettings] = useState(false);
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [showChordTemplates, setShowChordTemplates] = useState(false);
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
      midiAnnouncements.chordGenerated(newNotes.length);
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
      midiAnnouncements.exported('MIDI');
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
      midiAnnouncements.exported('WAV');
    } catch (err) {
      console.error('WAV export error:', err);
      error('Failed to export WAV file.');
    }
  };

  const handlePlay = () => {
    dispatch({ type: 'SET_PLAYING', payload: true });
    midiAnnouncements.playbackStarted();
  };

  const handlePause = () => {
    dispatch({ type: 'SET_PLAYING', payload: false });
    midiAnnouncements.playbackStopped();
  };

  const handleStop = () => {
    dispatch({ type: 'SET_PLAYING', payload: false });
    dispatch({ type: 'SET_CURRENT_TIME', payload: 0 });
    midiAnnouncements.playbackStopped();
  };

  // Setup comprehensive keyboard shortcuts
  const shortcuts = {
    play: {
      ...platformShortcut(commonShortcuts.play),
      handler: () => {
        if (state.isPlaying) {
          handlePause();
        } else {
          handlePlay();
        }
      }
    },
    stop: {
      ...platformShortcut(commonShortcuts.stop),
      handler: handleStop
    },
    pianoRollOpen: {
      ...platformShortcut(commonShortcuts.pianoRollOpen),
      handler: () => {
        if (!showPianoRoll) {
          setShowPianoRoll(true);
          midiAnnouncements.settingChanged('Piano Roll Editor', 'opened');
        }
      }
    },
    settings: {
      ...platformShortcut(commonShortcuts.settings),
      handler: () => {
        setShowSettings(!showSettings);
        midiAnnouncements.settingChanged('Settings Panel', showSettings ? 'closed' : 'opened');
      }
    },
    escape: {
      ...platformShortcut(commonShortcuts.escape),
      handler: () => {
        if (showPianoRoll) {
          setShowPianoRoll(false);
          midiAnnouncements.settingChanged('Piano Roll Editor', 'closed');
        } else if (showSettings) {
          setShowSettings(false);
          midiAnnouncements.settingChanged('Settings Panel', 'closed');
        } else if (showChordTemplates) {
          setShowChordTemplates(false);
          midiAnnouncements.settingChanged('Chord Templates', 'closed');
        }
      }
    },
    exportMidi: {
      ...platformShortcut(commonShortcuts.exportMidi),
      handler: handleExportMIDI
    },
    exportWav: {
      ...platformShortcut(commonShortcuts.exportWav),
      handler: handleExportWAV
    },
    generate: {
      ...platformShortcut(commonShortcuts.generate),
      handler: handleGenerate
    },
    clear: {
      ...platformShortcut(commonShortcuts.clear),
      handler: () => {
        clearNotes();
        midiAnnouncements.settingChanged('Notes', 'cleared');
      }
    }
  };

  useKeyboardShortcuts({ shortcuts });

  // Simple playback clock updating currentTime in context
  useEffect(() => {
    if (!state.isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }

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
  }, [state.isPlaying, state.currentTime, dispatch]);

  const pianoRollDimensions: PianoRollDimensions = {
    width: 1000,
    height: 400,
    noteHeight: 16,
    beatWidth: 50
  };

  const keySignature = `${state.rootNote} ${state.scaleType}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>
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
          onShowChordTemplates={() => setShowChordTemplates(true)}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-150" role="dialog" aria-modal="true" aria-label="Piano Roll">
          <div className="elevated-card max-w-[95vw] w-full max-h-[95vh] overflow-hidden border border-gray-700/50 animate-scale-in-150 bg-gray-800/90 backdrop-blur-md">
            {/* Enhanced Header */}
            <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-h4 text-white font-semibold">Piano Roll Editor</h2>
                      <p className="text-body-sm text-gray-400">Advanced MIDI editing workspace</p>
                    </div>
                  </div>
                  
                  {/* Controls Info */}
                  <div className="hidden lg:flex items-center space-x-4 text-body-sm text-gray-400 bg-gray-900/30 rounded-lg px-3 py-2">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Double-click: Add notes</span>
                    </span>
                    <span>•</span>
                    <span>Drag: Move</span>
                    <span>•</span>
                    <span>Edges: Resize</span>
                  </div>
                  
                  {/* Enhanced Quick Toggles */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-xs text-gray-300 bg-gray-900/30 rounded-lg px-3 py-2">
                      <span className="font-medium">Snap to Scale</span>
                      <button
                        onClick={() => updateSettings({ snapToScale: !(state.settings.snapToScale ?? true) })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 ${
                          state.settings.snapToScale ?? true 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg' 
                            : 'bg-gray-600'
                        }`}
                        aria-label="Toggle Snap to Scale"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                            state.settings.snapToScale ?? true ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-gray-300 bg-gray-900/30 rounded-lg px-3 py-2">
                      <span className="font-medium">Snap to Grid</span>
                      <button
                        onClick={() => updateSettings({ snapToGrid: !(state.settings.snapToGrid ?? true) })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 ${
                          state.settings.snapToGrid ?? true 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg' 
                            : 'bg-gray-600'
                        }`}
                        aria-label="Toggle Snap to Grid"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                            state.settings.snapToGrid ?? true ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-caption text-gray-400 bg-gray-900/30 rounded-lg px-3 py-2">
                    <span>Alt: chromatic • Shift: fine grid</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 hover:border-gray-500 hover:bg-gray-700/50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Export
                  </Button>
                  <button
                    onClick={() => setShowPianoRoll(false)}
                    aria-label="Close piano roll"
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Piano Roll Content */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800">
              <PianoRoll dimensions={pianoRollDimensions} />
            </div>
            
            {/* Enhanced Footer */}
            <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-body-sm text-gray-400">
                  <div className="flex items-center space-x-2 bg-gray-900/30 rounded-lg px-3 py-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-green-400">{state.notes.length}</span>
                    <span>notes</span>
                  </div>
                  <div className="hidden sm:flex items-center space-x-4">
                    <span>Range: C4 - C6</span>
                    <span>•</span>
                    <span>8 Bars</span>
                    <span>•</span>
                    <span>{keySignature}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 hover:border-gray-500 hover:bg-gray-700/50"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Save Changes
                  </Button>
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

      {/* Chord Templates */}
      {showChordTemplates && (
        <ChordTemplates onClose={() => setShowChordTemplates(false)} />
      )}
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
