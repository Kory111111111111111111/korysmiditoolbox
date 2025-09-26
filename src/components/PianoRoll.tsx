import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { MidiNote, PianoRollDimensions, RootNote, ScaleType, SectionType, AudioSectionType } from '@/types';
import { getNoteName, getScaleIntervals, getMidiNoteNumber } from '@/utils/midiUtils';
import { AudioService } from '@/services/audioService';

// Extended MidiNote type with section property
interface MidiNoteWithSection extends MidiNote {
  section?: SectionType;
}

interface PianoRollProps {
  dimensions: PianoRollDimensions;
}

type DragMode = 'move' | 'resize-start' | 'resize-end' | 'select' | 'none';

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Clipboard for copy/paste functionality
interface ClipboardNote {
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
}

const clipboard: ClipboardNote[] = [];

export default function PianoRoll({ dimensions }: PianoRollProps) {
  const { state, addNote, updateNote, deleteNote, selectNote, setEditingSection } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioServiceRef = useRef<AudioService | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [hoveredNote, setHoveredNote] = useState<{ pitch: number; time: number } | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number; noteId: string; original: MidiNote } | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<boolean>(false);

  // Initialize audio service for preview
  useEffect(() => {
    if (!audioServiceRef.current) {
      audioServiceRef.current = new AudioService();
      audioServiceRef.current.initialize().catch(console.error);
    }
  }, []);

  // Preview note function
  const previewNote = useCallback(async (pitch: number, sectionId: AudioSectionType = 'melody') => {
    if (audioServiceRef.current) {
      try {
        await audioServiceRef.current.previewNote(pitch, 0.6, sectionId, 0.3);
      } catch (error) {
        console.error('Failed to preview note:', error);
      }
    }
  }, []);

  // Get current section for preview
  const getCurrentSectionForPreview = useCallback((): AudioSectionType => {
    if (state.editingSection === 'all') return 'melody';
    return state.editingSection as AudioSectionType;
  }, [state.editingSection]);

  const { height, noteHeight, beatWidth } = dimensions;
  const beatsPerBar = 4;
  const bars = 4;
  const totalBeats = bars * beatsPerBar;
  const gridWidth = totalBeats * beatWidth;
  const quantDivisionsPerBeat = 4;
  const secondsPerBeat = 0.5;
  const quantUnitSec = secondsPerBeat / quantDivisionsPerBeat;

  // SIMPLE FILTERING - Just check section tags, no complex logic
  const getFilteredNotes = useCallback((): MidiNote[] => {
    if (state.editingSection === 'all') {
      return state.notes;
    }
    
    // Only show notes that have explicit section tags matching current section
    return state.notes.filter(note => {
      const noteWithSection = note as MidiNoteWithSection;
      return noteWithSection.section === state.editingSection;
    });
  }, [state.notes, state.editingSection]);

  const filteredNotes = getFilteredNotes();

  // Full piano range with scrolling
  const minNote = 21; // A0
  const maxNote = 108; // C8
  const noteRange = maxNote - minNote + 1;
  const pianoHeight = noteRange * noteHeight;

  // Scale helpers
  const allowedPitchClasses = useCallback((): Set<number> => {
    const rootPc = getMidiNoteNumber(state.rootNote as RootNote, 0) % 12;
    const intervals = getScaleIntervals(state.scaleType as ScaleType);
    const pcs = new Set<number>();
    intervals.forEach(iv => pcs.add((rootPc + iv) % 12));
    return pcs;
  }, [state.rootNote, state.scaleType]);

  const snapPitchToScale = useCallback((pitch: number): number => {
    const pcs = allowedPitchClasses();
    const pc = ((pitch % 12) + 12) % 12;
    if (pcs.has(pc)) return pitch;
    for (let delta = 1; delta <= 6; delta++) {
      const up = ((pc + delta) % 12);
      const down = ((pc - delta + 12) % 12);
      if (pcs.has(up)) return pitch + delta;
      if (pcs.has(down)) return pitch - delta;
    }
    return pitch;
  }, [allowedPitchClasses]);

  const quantizeTime = useCallback((timeSec: number, opts?: { snapToGrid?: boolean; fineGrid?: boolean }): number => {
    const shouldSnap = opts?.snapToGrid ?? (state.settings.snapToGrid ?? true);
    if (!shouldSnap) return Math.max(0, timeSec);
    const step = (opts?.fineGrid ? quantUnitSec / 4 : quantUnitSec);
    return Math.max(0, Math.round(timeSec / step) * step);
  }, [state.settings.snapToGrid, quantUnitSec]);

  const getNoteFromPosition = useCallback((x: number, y: number, opts?: { chromatic?: boolean; fineGrid?: boolean }): MidiNote | null => {
    const noteY = Math.floor(y / noteHeight);
    let pitch = maxNote - noteY;
    
    if ((state.settings.snapToScale ?? true) && !opts?.chromatic) {
      pitch = snapPitchToScale(pitch);
    }
    
    if (pitch < minNote || pitch > maxNote) return null;

    const startTimeRaw = (x / (beatWidth / 2));
    const startTime = quantizeTime(startTimeRaw, { fineGrid: opts?.fineGrid, snapToGrid: state.settings.snapToGrid });
    const duration = secondsPerBeat; // Default to quarter note (0.5s) which fills one grid section

    return {
      id: '',
      pitch,
      startTime,
      duration,
      velocity: 0.8
    };
  }, [noteHeight, maxNote, state.settings.snapToScale, snapPitchToScale, minNote, beatWidth, quantizeTime, state.settings.snapToGrid, secondsPerBeat]);

  const findNoteAtPosition = useCallback((x: number, y: number): { note: MidiNote; resizeType: 'resize-start' | 'resize-end' | 'move' } | null => {
    for (const note of filteredNotes) {
      const noteY = (maxNote - note.pitch) * noteHeight;
      const noteX = note.startTime * (beatWidth / 2);
      const noteWidth = note.duration * (beatWidth / 2);

      if (y >= noteY && y <= noteY + noteHeight && x >= noteX && x <= noteX + noteWidth) {
        const resizeThreshold = 6;
        if (x - noteX < resizeThreshold) {
          return { note, resizeType: 'resize-start' };
        } else if (noteX + noteWidth - x < resizeThreshold) {
          return { note, resizeType: 'resize-end' };
        } else {
          return { note, resizeType: 'move' };
        }
      }
    }
    return null;
  }, [filteredNotes, maxNote, noteHeight, beatWidth]);

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Colors
    const bg = '#0b0f18';
    const rowEven = '#0e1422';
    const rowOdd = '#0b0f18';
    const gridMinor = '#182235';
    const gridMajor = '#334155';

    const isBlackKey = (midi: number) => {
      const n = midi % 12;
      return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
    };

    // Clear and background
    ctx.clearRect(0, 0, gridWidth, pianoHeight);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, gridWidth, pianoHeight);

    // Row shading
    for (let i = 0; i < noteRange; i++) {
      const pitch = maxNote - i;
      const y = i * noteHeight;
      ctx.fillStyle = isBlackKey(pitch) ? rowEven : rowOdd;
      ctx.fillRect(0, y, gridWidth, noteHeight);
    }

    // Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridMinor;
    for (let i = 0; i <= noteRange; i++) {
      const y = i * noteHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gridWidth, y);
      ctx.stroke();
    }

    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = beat * beatWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pianoHeight);
      ctx.stroke();
    }

    // Bar lines
    ctx.lineWidth = 2;
    ctx.strokeStyle = gridMajor;
    for (let bar = 0; bar < bars; bar++) {
      const x = bar * beatsPerBar * beatWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pianoHeight);
      ctx.stroke();
    }

    // Draw notes with rounded corners and proper sizing
    filteredNotes.forEach(note => {
      const noteY = (maxNote - note.pitch) * noteHeight + 0.5;
      const noteX = note.startTime * (beatWidth / 2);
      const noteWidth = Math.max(8, note.duration * (beatWidth / 2)); // Minimum width for visibility
      const noteHeightPx = Math.max(2, noteHeight - 2);

      const isSelected = selectedNotes.has(note.id);
      
      // Simple color coding
      let color = '#22c55e'; // Green for melody/default
      if (state.editingSection === 'chord') color = '#3b82f6'; // Blue
      if (state.editingSection === 'bass') color = '#f59e0b'; // Orange  
      if (state.editingSection === 'arp') color = '#a855f7'; // Purple

      // Rounded rectangle function
      const roundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        const radius = Math.min(r, h / 2, w / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      // Enhanced glow for selected notes
      ctx.save();
      const glowColor = isSelected ? 'rgba(59,130,246,0.45)' : 'rgba(34,197,94,0.35)';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isSelected ? 15 : 10;
      
      // Create gradient
      const grad = ctx.createLinearGradient(noteX, noteY, noteX, noteY + noteHeightPx);
      if (isSelected) {
        grad.addColorStop(0, '#60a5fa');
        grad.addColorStop(1, '#3b82f6');
      } else {
        const alpha = 'cc'; // 80% opacity
        grad.addColorStop(0, color + alpha);
        grad.addColorStop(1, color + '99'); // 60% opacity
      }
      
      ctx.fillStyle = grad;
      roundedRect(noteX, noteY, noteWidth, noteHeightPx, 4);
      ctx.fill();
      ctx.restore();

      // Enhanced border
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = isSelected ? '#0ea5e9' : color;
      roundedRect(noteX, noteY, noteWidth, noteHeightPx, 4);
      ctx.stroke();
    });

    // Selection box
    if (selectionBox && isSelecting) {
      const { startX, startY, endX, endY } = selectionBox;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);
      
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    // Playhead
    if (state.isPlaying) {
      const playheadX = state.currentTime * (beatWidth / 2);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, pianoHeight);
      ctx.stroke();
    }
  }, [filteredNotes, state.editingSection, state.isPlaying, state.currentTime, selectedNotes, selectionBox, isSelecting, gridWidth, pianoHeight, noteHeight, beatWidth, maxNote, noteRange, totalBeats, bars, beatsPerBar]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvasRef.current || !document.activeElement || document.activeElement !== canvasRef.current) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'delete':
        case 'backspace':
          e.preventDefault();
          if (selectedNotes.size > 0) {
            selectedNotes.forEach(noteId => {
              if (filteredNotes.some(n => n.id === noteId)) {
                deleteNote(noteId);
              }
            });
            setSelectedNotes(new Set());
          }
          break;

        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allNoteIds = new Set(filteredNotes.map(n => n.id));
            setSelectedNotes(allNoteIds);
          }
          break;

        case 'escape':
          setSelectedNotes(new Set());
          selectNote(null);
          setSelectionBox(null);
          setIsSelecting(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNotes, filteredNotes, deleteNote, selectNote]);

  // Mouse handlers with full drag functionality
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const foundNote = findNoteAtPosition(x, y);
    const now = Date.now();
    const isDoubleClick = now - lastClickTime < 300;
    setLastClickTime(now);
    
    if (foundNote) {
      const isNoteSelected = selectedNotes.has(foundNote.note.id);
      
      if (e.shiftKey) {
        const newSelection = new Set(selectedNotes);
        if (isNoteSelected) {
          newSelection.delete(foundNote.note.id);
        } else {
          newSelection.add(foundNote.note.id);
        }
        setSelectedNotes(newSelection);
        selectNote(foundNote.note.id);
      } else if (e.ctrlKey || e.metaKey) {
        const newSelection = new Set(selectedNotes);
        if (isNoteSelected) {
          newSelection.delete(foundNote.note.id);
          if (newSelection.size === 0) {
            selectNote(null);
          } else {
            selectNote(Array.from(newSelection)[0]);
          }
        } else {
          newSelection.add(foundNote.note.id);
          selectNote(foundNote.note.id);
        }
        setSelectedNotes(newSelection);
      } else {
        setSelectedNotes(new Set([foundNote.note.id]));
        selectNote(foundNote.note.id);
      }
      
      setDragMode(foundNote.resizeType);
      dragOriginRef.current = { x, y, noteId: foundNote.note.id, original: { ...foundNote.note } };
    } else {
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setSelectedNotes(new Set());
        selectNote(null);
      }
      
      if (!isDoubleClick) {
        setIsSelecting(true);
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
        setDragMode('select');
      }
    }
  };

  const handleMouseUp = () => {
    if (dragMode === 'select' && selectionBox && isSelecting) {
      const { startX, startY, endX, endY } = selectionBox;
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      const selectedNoteIds = new Set<string>();
      
      filteredNotes.forEach(note => {
        const noteY = (maxNote - note.pitch) * noteHeight;
        const noteX = note.startTime * (beatWidth / 2);
        const noteWidth = note.duration * (beatWidth / 2);
        
        if (noteX < maxX && noteX + noteWidth > minX && 
            noteY < maxY && noteY + noteHeight > minY) {
          selectedNoteIds.add(note.id);
        }
      });
      
      setSelectedNotes(selectedNoteIds);
      if (selectedNoteIds.size === 1) {
        selectNote(Array.from(selectedNoteIds)[0]);
      } else if (selectedNoteIds.size === 0) {
        selectNote(null);
      }
    }
    
    setDragMode('none');
    setIsSelecting(false);
    setSelectionBox(null);
    dragOriginRef.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragMode === 'select' && isSelecting && selectionBox) {
      setSelectionBox(prev => prev ? {
        ...prev,
        endX: x,
        endY: y
      } : null);
      return;
    }

    if (dragMode === 'none' || !dragOriginRef.current) return;

    const now = performance.now();
    if (pendingUpdateRef.current || (now - lastUpdateRef.current < 16)) {
      return;
    }
    
    pendingUpdateRef.current = true;
    requestAnimationFrame(() => {
      pendingUpdateRef.current = false;
      lastUpdateRef.current = performance.now();
      
      const origin = dragOriginRef.current;
      if (!origin) return;
      
      // Always use state.notes for finding notes during drag
      const note = state.notes.find(n => n.id === origin.noteId);
      if (!note) {
        console.error('Note not found during drag:', origin.noteId);
        return;
      }

      const deltaX = x - origin.x;
      const deltaY = y - origin.y;

      if (dragMode === 'move') {
        const semitoneSteps = Math.round(deltaY / noteHeight);
        const proposedPitch = origin.original.pitch - semitoneSteps;
        const clampedPitch = Math.max(minNote, Math.min(maxNote, proposedPitch));

        const startTimeRaw = origin.original.startTime + deltaX / (beatWidth / 2);
        const newStartTime = quantizeTime(Math.max(0, startTimeRaw), { 
          fineGrid: e.shiftKey, 
          snapToGrid: state.settings.snapToGrid 
        });

        const pitchDelta = clampedPitch - origin.original.pitch;
        const timeDelta = newStartTime - origin.original.startTime;

        const notesToMove = selectedNotes.size > 1 && selectedNotes.has(origin.noteId) 
          ? Array.from(selectedNotes)
              .map(id => state.notes.find(n => n.id === id))
              .filter((n): n is MidiNote => n !== undefined)
          : [note];

        notesToMove.forEach(noteToMove => {
          if (noteToMove.id === origin.noteId) {
            updateNote(noteToMove.id, {
              pitch: clampedPitch,
              startTime: newStartTime
            });
          } else {
            const newPitch = Math.max(minNote, Math.min(maxNote, noteToMove.pitch + pitchDelta));
            const newTime = Math.max(0, noteToMove.startTime + timeDelta);
            updateNote(noteToMove.id, {
              pitch: newPitch,
              startTime: newTime
            });
          }
        });
        
      } else if (dragMode === 'resize-start') {
        const startTimeRaw = origin.original.startTime + deltaX / (beatWidth / 2);
        const newStartTime = quantizeTime(Math.max(0, startTimeRaw), { 
          fineGrid: e.shiftKey, 
          snapToGrid: state.settings.snapToGrid 
        });
        const newDuration = Math.max(
          quantUnitSec / (e.shiftKey ? 4 : 1), 
          origin.original.duration - (newStartTime - origin.original.startTime)
        );

        updateNote(origin.noteId, {
          startTime: newStartTime,
          duration: newDuration
        });
      } else if (dragMode === 'resize-end') {
        const newDuration = Math.max(
          quantUnitSec / (e.shiftKey ? 4 : 1), 
          quantizeTime(
            origin.original.duration + deltaX / (beatWidth / 2), 
            { fineGrid: e.shiftKey, snapToGrid: state.settings.snapToGrid }
          )
        );

        updateNote(origin.noteId, {
          duration: newDuration
        });
      }
    });
  };

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing note
    const existingNote = findNoteAtPosition(x, y);
    if (existingNote) return;

    const newNote = getNoteFromPosition(x, y);
    if (newNote && newNote.pitch >= minNote && newNote.pitch <= maxNote) {
      // Default to quarter note duration (fills one grid section)
      const quarterNoteDuration = secondsPerBeat; // 0.5 seconds = quarter note at 120 BPM
      addNote({
        ...newNote,
        duration: quarterNoteDuration, // Full quarter note instead of short 16th
        section: state.editingSection === 'all' ? 'melody' : state.editingSection
      } as Omit<MidiNoteWithSection, "id">);
    }
  }, [findNoteAtPosition, getNoteFromPosition, minNote, maxNote, secondsPerBeat, addNote, state.editingSection]);

  // Section options
  const sectionOptions: { value: SectionType; label: string; color: string }[] = [
    { value: 'all', label: 'All Parts', color: 'text-white' },
    { value: 'chord', label: 'Chord', color: 'text-blue-400' },
    { value: 'melody', label: 'Melody', color: 'text-green-400' },
    { value: 'bass', label: 'Bass', color: 'text-yellow-400' },
    { value: 'arp', label: 'Arp', color: 'text-purple-400' }
  ];

  const currentSection = sectionOptions.find(opt => opt.value === state.editingSection) || sectionOptions[0];

  return (
    <div className="flex flex-col bg-gray-900 relative">
      {/* Section Selector Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-white">Piano Roll Editor</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Editing:</span>
            <select
              value={state.editingSection}
              onChange={(e) => setEditingSection(e.target.value as SectionType)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sectionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className={`text-sm font-medium ${currentSection.color}`}>
              ({filteredNotes.length} notes)
            </span>
          </div>
        </div>
      </div>

      {/* Main Editor with Scrolling */}
      <div className="flex flex-1 h-[600px]">
        {/* Piano Keyboard */}
        <div className="w-20 bg-gray-950 border-r border-gray-800 relative overflow-y-auto">
          <div style={{ height: pianoHeight }}>
            {Array.from({ length: noteRange }, (_, i) => {
              const pitch = maxNote - i;
              const noteName = getNoteName(pitch);
              const isBlackKey = noteName.includes('#');
              const isInScale = allowedPitchClasses().has(pitch % 12);
              
              return (
                <div
                  key={pitch}
                  className={`flex items-center justify-center text-xs font-semibold border-b border-gray-800 relative ${
                    isBlackKey 
                      ? 'bg-gray-800 text-white hover:bg-gray-700' 
                      : 'bg-gray-900 text-gray-200 hover:bg-gray-800'
                  } ${
                    isInScale ? 'ring-1 ring-indigo-500/30' : ''
                  }`}
                  style={{ height: noteHeight }}
                  onClick={() => previewNote(pitch, getCurrentSectionForPreview())}
                >
                  {noteName}
                  {isInScale && (
                    <div className="absolute right-1 w-1 h-1 bg-indigo-400 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Piano Roll Canvas */}
        <div className="flex-1 relative bg-gray-900 overflow-auto">
          <canvas
            ref={canvasRef}
            width={gridWidth}
            height={pianoHeight}
            className="block focus:outline-none"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onDoubleClick={handleDoubleClick}
            tabIndex={0}
          />
          
          {/* Info overlay */}
          <div className="absolute top-2 right-2 space-y-2">
            <div className="bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm border border-gray-700/50">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">{selectedNotes.size} selected</span>
              </div>
              <div className="text-gray-300 space-y-1">
                <div>Double-click: Add notes</div>
                <div>Section: {currentSection.label}</div>
              </div>
            </div>

            {/* Debug info - toggleable */}
            {showDebug && (
              <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm border border-red-700/50">
                <div className="text-red-400 font-medium mb-1">Debug Info</div>
                <div className="text-gray-300 space-y-1">
                  <div>Total: {state.notes.length} notes</div>
                  <div>Filtered: {filteredNotes.length} notes</div>
                  <div>Section: {state.editingSection}</div>
                </div>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`text-xs px-2 py-1 rounded backdrop-blur-sm border transition-colors ${
                  showDebug 
                    ? 'bg-red-600/80 text-white border-red-500/50' 
                    : 'bg-black/60 text-white border-gray-700/50'
                }`}
              >
                🐛
              </button>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm border border-gray-700/50"
              >
                ?
              </button>
            </div>
          </div>

          {/* Help overlay */}
          {showHelp && (
            <div className="absolute inset-4 bg-black/90 backdrop-blur-md rounded-xl border border-gray-700 p-6 text-white z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-semibold">Piano Roll Guide</h3>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              
              <div className="text-sm space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-indigo-400">Sections</h4>
                  <div className="space-y-1">
                    <div><span className="text-blue-400">Chord:</span> Harmonic content</div>
                    <div><span className="text-green-400">Melody:</span> Main melodic lines</div>
                    <div><span className="text-yellow-400">Bass:</span> Low-end foundation</div>
                    <div><span className="text-purple-400">Arp:</span> Arpeggiated patterns</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-green-400">Controls</h4>
                  <div className="space-y-1">
                    <div>Double-click: Add note</div>
                    <div>Scroll: Navigate piano range</div>
                    <div>Section dropdown: Switch editing mode</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}