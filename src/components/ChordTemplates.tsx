import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { MidiNote, RootNote } from '@/types';
import { getMidiNoteNumber } from '@/utils/midiUtils';
import { 
  SparklesIcon, 
  MusicalNoteIcon,
  BoltIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface ChordTemplate {
  name: string;
  description: string;
  intervals: number[];
  category: 'basic' | 'extended' | 'jazz' | 'modern';
  color: string;
}

const CHORD_TEMPLATES: ChordTemplate[] = [
  // Basic Triads
  { name: 'Major', description: 'Happy, bright sound', intervals: [0, 4, 7], category: 'basic', color: 'bg-green-500' },
  { name: 'Minor', description: 'Sad, dark sound', intervals: [0, 3, 7], category: 'basic', color: 'bg-blue-500' },
  { name: 'Diminished', description: 'Tense, unstable', intervals: [0, 3, 6], category: 'basic', color: 'bg-red-500' },
  { name: 'Augmented', description: 'Dreamy, floating', intervals: [0, 4, 8], category: 'basic', color: 'bg-purple-500' },
  
  // Extended Chords
  { name: 'Maj7', description: 'Dreamy, sophisticated', intervals: [0, 4, 7, 11], category: 'extended', color: 'bg-emerald-500' },
  { name: 'Min7', description: 'Smooth, mellow', intervals: [0, 3, 7, 10], category: 'extended', color: 'bg-indigo-500' },
  { name: 'Dom7', description: 'Bluesy, resolving', intervals: [0, 4, 7, 10], category: 'extended', color: 'bg-orange-500' },
  { name: 'Min7b5', description: 'Half-diminished, jazzy', intervals: [0, 3, 6, 10], category: 'extended', color: 'bg-gray-500' },
  
  // Jazz Chords
  { name: 'Maj9', description: 'Lush, colorful', intervals: [0, 4, 7, 11, 14], category: 'jazz', color: 'bg-teal-500' },
  { name: 'Dom13', description: 'Rich, complex', intervals: [0, 4, 7, 10, 14, 17, 21], category: 'jazz', color: 'bg-yellow-500' },
  { name: 'Alt Dom', description: 'Altered tensions', intervals: [0, 4, 7, 10, 13, 16], category: 'jazz', color: 'bg-pink-500' },
  
  // Modern/Contemporary
  { name: 'Sus2', description: 'Open, airy', intervals: [0, 2, 7], category: 'modern', color: 'bg-cyan-500' },
  { name: 'Sus4', description: 'Suspended, unresolved', intervals: [0, 5, 7], category: 'modern', color: 'bg-lime-500' },
  { name: 'Add9', description: 'Colorful major', intervals: [0, 4, 7, 14], category: 'modern', color: 'bg-violet-500' },
  { name: 'Quartal', description: 'Modern, stacked 4ths', intervals: [0, 5, 10, 15], category: 'modern', color: 'bg-rose-500' },
];

const CHORD_PROGRESSIONS = [
  { name: 'I-V-vi-IV', description: 'Pop progression', chords: ['Maj', 'Maj', 'Min', 'Maj'], keys: [0, 7, 9, 5] },
  { name: 'ii-V-I', description: 'Jazz standard', chords: ['Min7', 'Dom7', 'Maj7'], keys: [2, 7, 0] },
  { name: 'vi-IV-I-V', description: 'Emotional ballad', chords: ['Min', 'Maj', 'Maj', 'Maj'], keys: [9, 5, 0, 7] },
  { name: 'I-vi-ii-V', description: 'Circle of fifths', chords: ['Maj', 'Min', 'Min', 'Maj'], keys: [0, 9, 2, 7] },
  { name: 'i-VII-VI-VII', description: 'Minor modal', chords: ['Min', 'Maj', 'Maj', 'Maj'], keys: [0, 10, 8, 10] },
];

interface ChordTemplatesProps {
  onClose: () => void;
}

export function ChordTemplates({ onClose }: ChordTemplatesProps) {
  const { state, addNote, clearNotes } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeChord, setActiveChord] = useState<ChordTemplate | null>(null);

  const categories = [
    { id: 'all', name: 'All Chords', icon: MusicalNoteIcon },
    { id: 'basic', name: 'Basic', icon: BoltIcon },
    { id: 'extended', name: 'Extended', icon: SparklesIcon },
    { id: 'jazz', name: 'Jazz', icon: FireIcon },
    { id: 'modern', name: 'Modern', icon: SparklesIcon },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? CHORD_TEMPLATES 
    : CHORD_TEMPLATES.filter(t => t.category === selectedCategory);

  const generateChord = (template: ChordTemplate, octave: number = 4) => {
    const rootNote = getMidiNoteNumber(state.rootNote as RootNote, octave);
    const startTime = 0;
    const duration = 2; // 2 seconds
    
    clearNotes();
    
    template.intervals.forEach((interval, index) => {
      const pitch = rootNote + interval;
      const note: Omit<MidiNote, 'id'> = {
        pitch,
        startTime: startTime + (index * 0.1), // Slight stagger for better sound
        duration,
        velocity: 0.7 - (index * 0.05) // Decrease velocity for higher notes
      };
      addNote(note);
    });
    
    setActiveChord(template);
  };

  const generateProgression = (progression: typeof CHORD_PROGRESSIONS[0]) => {
    clearNotes();
    const rootNote = getMidiNoteNumber(state.rootNote as RootNote, 4);
    const chordDuration = 2;
    
    progression.chords.forEach((chordType, chordIndex) => {
      const chordKey = progression.keys[chordIndex];
      const chordRoot = rootNote + chordKey;
      const startTime = chordIndex * chordDuration;
      
      // Find the chord template
      const template = CHORD_TEMPLATES.find(t => 
        chordType.includes(t.name) || t.name.includes(chordType)
      ) || CHORD_TEMPLATES[0];
      
      template.intervals.forEach((interval, noteIndex) => {
        const pitch = chordRoot + interval;
        const note: Omit<MidiNote, 'id'> = {
          pitch,
          startTime: startTime + (noteIndex * 0.05),
          duration: chordDuration * 0.9,
          velocity: 0.6 - (noteIndex * 0.03)
        };
        addNote(note);
      });
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="elevated-card max-w-4xl w-full max-h-[90vh] overflow-hidden bg-gray-800/90 backdrop-blur-md border border-gray-700/50">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-700/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <MusicalNoteIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-h4 text-white font-semibold">Chord Templates</h2>
                <p className="text-body-sm text-gray-400">Quick chord generation and progressions</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Categories Sidebar */}
          <div className="w-48 bg-gray-900/50 border-r border-gray-700/50 p-4">
            <div className="space-y-2">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Progressions */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Progressions</h3>
              <div className="space-y-2">
                {CHORD_PROGRESSIONS.map((prog, index) => (
                  <button
                    key={index}
                    onClick={() => generateProgression(prog)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                  >
                    <div className="font-medium">{prog.name}</div>
                    <div className="text-gray-500">{prog.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((template, index) => (
                <div
                  key={index}
                  className={`relative p-4 rounded-xl border border-gray-700/50 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    activeChord?.name === template.name
                      ? 'ring-2 ring-indigo-500 bg-gray-800/80'
                      : 'bg-gray-800/30 hover:bg-gray-800/60'
                  }`}
                  onClick={() => generateChord(template)}
                >
                  {/* Chord Color Indicator */}
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${template.color}`} />
                  
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                    <p className="text-xs text-gray-400">{template.description}</p>
                  </div>
                  
                  {/* Interval Display */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.intervals.map((interval, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300"
                      >
                        {interval === 0 ? 'R' : `+${interval}`}
                      </span>
                    ))}
                  </div>
                  
                  {/* Category Badge */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.category === 'basic' ? 'bg-green-500/20 text-green-400' :
                      template.category === 'extended' ? 'bg-blue-500/20 text-blue-400' :
                      template.category === 'jazz' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {template.category}
                    </span>
                    
                    {activeChord?.name === template.name && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Current Key Display */}
            <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300">Current Key</h3>
                  <p className="text-lg font-bold text-white">{state.rootNote} {state.scaleType}</p>
                </div>
                {activeChord && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300">Active Chord</h3>
                    <p className="text-lg font-bold text-indigo-400">{state.rootNote}{activeChord.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}