import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import PianoRoll from '@/components/PianoRoll';
import SettingsPanel from '@/components/SettingsPanel';
import { GeminiService } from '@/services/geminiService';
import { MidiExportService } from '@/services/midiExportService';
import { getDefaultProgression } from '@/utils/defaultProgression';
import { PianoRollDimensions, RootNote, ScaleType } from '@/types';

function MainApp() {
  const { state, dispatch, clearNotes, setRootNote, setScaleType } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const geminiService = useRef<GeminiService | null>(null);
  const midiExportService = useRef<MidiExportService | null>(null);

  // Initialize services
  useEffect(() => {
    if (state.settings.apiKey) {
      geminiService.current = new GeminiService(state.settings.apiKey);
    }
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

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark');
  }, [state.settings.theme]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerate = async () => {
    if (!state.settings.apiKey) {
      showToast('Please set your Gemini API key in the settings panel.');
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
      
      showToast('Chord progression generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to generate chord progression.');
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
      
      showToast('Download started! MIDI export');
    } catch (error) {
      console.error('MIDI export error:', error);
      showToast('Failed to export MIDI file.');
    }
  };

  // WAV export moved to ControlBar to consolidate actions

  const pianoRollDimensions: PianoRollDimensions = {
    width: 1000,
    height: 400,
    noteHeight: 16,
    beatWidth: 50
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-gray-300">←</span>
              <h1 className="text-lg font-medium">Untitled *</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-700 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-700 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-700 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Type any idea or vibe for your beat..."
                className="w-80 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <span className="text-sm text-gray-400">v 1.0</span>
          </div>

          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
            <button 
              onClick={handleExportMIDI}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-lg flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Tabs */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-gray-800 rounded text-sm">1</button>
              <button className="px-3 py-1 bg-gray-800 rounded text-sm">Verse</button>
              <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">+</button>
            </div>
          </div>

          {/* Chord Progression */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Cinematic Pi...</span>
                <div className="flex space-x-1">
                  <button className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs">M</button>
                  <button className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs">S</button>
                </div>
              </div>
              <button className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Chord Blocks */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {state.notes.length > 0 ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setShowPianoRoll(true)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>C</span>
                      <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setShowPianoRoll(true)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>G</span>
                      <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setShowPianoRoll(true)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>Am</span>
                      <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setShowPianoRoll(true)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>F</span>
                      <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm">+</button>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No chords generated yet</div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Add Melody</button>
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Add Bass</button>
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Add Drums</button>
              </div>
              
              <button 
                onClick={() => setShowPianoRoll(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-medium flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span>Open Piano Roll Editor</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>

          {/* Generate Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-300">Root Note</label>
                  <select
                    value={state.rootNote}
                    onChange={(e) => setRootNote(e.target.value as RootNote)}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  >
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
                      <option key={note} value={note}>{note}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-300">Scale</label>
                  <select
                    value={state.scaleType}
                    onChange={(e) => setScaleType(e.target.value as ScaleType)}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  >
                    {['Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Harmonic Minor'].map(scale => (
                      <option key={scale} value={scale}>{scale}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !state.settings.apiKey}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Playback Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Volume</span>
              <input type="range" className="w-20" />
              <span className="text-sm text-gray-400">100</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-400">120 BPM</span>
            <span className="text-sm text-gray-400">C Major</span>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-700 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.333 4z" />
                </svg>
              </button>
              <button className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-8v8m5-8v8" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-700 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-700 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-700 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-700 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-700 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Piano Roll Modal (Hidden by default) */}
      {showPianoRoll && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 bg-gray-750">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <h2 className="text-xl font-semibold text-white">Piano Roll Editor</h2>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>•</span>
                    <span>Double-click to add notes</span>
                    <span>•</span>
                    <span>Drag to move</span>
                    <span>•</span>
                    <span>Resize edges</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => setShowPianoRoll(false)}
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
            <div className="p-4 border-t border-gray-700 bg-gray-750">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Notes: {state.notes.length}</span>
                  <span>•</span>
                  <span>Range: C4 - C6</span>
                  <span>•</span>
                  <span>Bars: 8</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">Clear All</button>
                  <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">Save Changes</button>
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

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
