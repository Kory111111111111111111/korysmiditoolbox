import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { MidiNote, PianoRollDimensions, RootNote, ScaleType } from '@/types';
import { getNoteName, getScaleIntervals, getMidiNoteNumber } from '@/utils/midiUtils';

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

let clipboard: ClipboardNote[] = [];

export default function PianoRoll({ dimensions }: PianoRollProps) {
  const { state, addNote, updateNote, deleteNote, selectNote } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number; noteId: string; original: MidiNote } | null>(null);

  const { width, height, noteHeight, beatWidth } = dimensions;
  const beatsPerBar = 4;
  const bars = 8;
  const totalBeats = bars * beatsPerBar;
  const gridWidth = totalBeats * beatWidth;
  const quantDivisionsPerBeat = 4; // 16th notes
  const secondsPerBeat = 0.5; // assuming 120 BPM mapping used elsewhere
  const quantUnitSec = secondsPerBeat / quantDivisionsPerBeat; // 0.125s

  // Generate piano keys (C4 to C6) - More focused range
  const minNote = 60; // C4
  const maxNote = 84; // C6
  const noteRange = maxNote - minNote + 1;
  const pianoHeight = noteRange * noteHeight;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helpers and palette (dark-only)
    const bg = '#0b0f18';
    const rowEven = '#0e1422';
    const rowOdd = '#0b0f18';
    const gridMinor = '#182235';
    const gridMajor = '#334155';
    const greenTop = '#22c55e';
    const greenBottom = '#16a34a';
    const blueTop = '#60a5fa';
    const blueBottom = '#3b82f6';
    const noteBorder = '#0ea5e9';
    const noteBorderGreen = '#10b981';

    const isBlackKey = (midi: number) => {
      const n = midi % 12;
      return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
    };

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

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

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

    // Bar lines (thicker)
    ctx.lineWidth = 2;
    ctx.strokeStyle = gridMajor;
    for (let bar = 0; bar <= bars; bar++) {
      const x = bar * beatsPerBar * beatWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pianoHeight);
      ctx.stroke();
    }

    // Draw notes with gradient, rounded corners and glow
    state.notes.forEach(note => {
      const noteY = (maxNote - note.pitch) * noteHeight + 0.5;
      const noteX = note.startTime * (beatWidth / 2);
      const noteWidth = Math.max(2, note.duration * (beatWidth / 2));
      const noteHeightPx = Math.max(2, noteHeight - 2);

      const isSelected = state.selectedNoteId === note.id || selectedNotes.has(note.id);
      const isMultiSelected = selectedNotes.has(note.id) && selectedNotes.size > 1;
      
      // Create gradient based on selection state
      const grad = ctx.createLinearGradient(noteX, noteY, noteX, noteY + noteHeightPx);
      if (isMultiSelected) {
        grad.addColorStop(0, '#f59e0b'); // Orange for multi-selection
        grad.addColorStop(1, '#d97706');
      } else if (isSelected) {
        grad.addColorStop(0, blueTop);
        grad.addColorStop(1, blueBottom);
      } else {
        grad.addColorStop(0, greenTop);
        grad.addColorStop(1, greenBottom);
      }
      ctx.fillStyle = grad;

      // Enhanced glow for selected notes
      ctx.save();
      const glowColor = isMultiSelected 
        ? 'rgba(245,158,11,0.6)' 
        : isSelected 
          ? 'rgba(59,130,246,0.45)' 
          : 'rgba(34,197,94,0.35)';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isSelected ? 15 : 10;
      roundedRect(noteX, noteY, noteWidth, noteHeightPx, 5);
      ctx.fill();
      ctx.restore();

      // Enhanced border for selected notes
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = isMultiSelected 
        ? '#f59e0b' 
        : isSelected 
          ? noteBorder 
          : noteBorderGreen;
      roundedRect(noteX, noteY, noteWidth, noteHeightPx, 5);
      ctx.stroke();
      
      // Add selection indicator
      if (isSelected && selectedNotes.size > 1) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(noteX + noteWidth - 6, noteY + 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓', noteX + noteWidth - 6, noteY + 9);
      }
    });

    // Draw selection box
    if (selectionBox && isSelecting) {
      const { startX, startY, endX, endY } = selectionBox;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);
      
      // Selection box fill
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.fillRect(x, y, w, h);
      
      // Selection box border
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    // Draw playhead
    if (state.isPlaying) {
      const playheadX = state.currentTime * (beatWidth / 2);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, pianoHeight);
      ctx.stroke();
    }
  }, [state, width, height, noteHeight, beatWidth, gridWidth, noteRange, pianoHeight, totalBeats]);

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
            selectedNotes.forEach(noteId => deleteNote(noteId));
            setSelectedNotes(new Set());
          } else if (state.selectedNoteId) {
            deleteNote(state.selectedNoteId);
          }
          break;

        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allNoteIds = new Set(state.notes.map(n => n.id));
            setSelectedNotes(allNoteIds);
          }
          break;

        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const notesToCopy = selectedNotes.size > 0 
              ? state.notes.filter(n => selectedNotes.has(n.id))
              : state.selectedNoteId 
                ? state.notes.filter(n => n.id === state.selectedNoteId)
                : [];
            
            if (notesToCopy.length > 0) {
              // Calculate relative positions
              const minTime = Math.min(...notesToCopy.map(n => n.startTime));
              clipboard = notesToCopy.map(note => ({
                pitch: note.pitch,
                startTime: note.startTime - minTime,
                duration: note.duration,
                velocity: note.velocity
              }));
            }
          }
          break;

        case 'v':
          if ((e.ctrlKey || e.metaKey) && clipboard.length > 0) {
            e.preventDefault();
            const pasteTime = state.currentTime || 0;
            const newNotes: MidiNote[] = clipboard.map(clipNote => ({
              id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              pitch: clipNote.pitch,
              startTime: pasteTime + clipNote.startTime,
              duration: clipNote.duration,
              velocity: clipNote.velocity
            }));
            
            // Clear current selection
            setSelectedNotes(new Set());
            selectNote(null);
            
            // Add new notes and select them
            const newNoteIds = new Set<string>();
            newNotes.forEach(note => {
              addNote(note);
              newNoteIds.add(note.id);
            });
            setSelectedNotes(newNoteIds);
          }
          break;

        case 'escape':
          setSelectedNotes(new Set());
          selectNote(null);
          setSelectionBox(null);
          setIsSelecting(false);
          break;

        case '?':
        case 'h':
          if (!e.ctrlKey && !e.metaKey) {
            setShowHelp(!showHelp);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNotes, state.notes, state.selectedNoteId, state.currentTime, deleteNote, addNote, selectNote, showHelp]);

  // --- Scale snapping helpers ---
  const allowedPitchClasses = useCallback((): Set<number> => {
    // Root note pitch class (0-11)
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
    // Search nearest semitone offset up/down up to an octave
    for (let delta = 1; delta <= 6; delta++) {
      const up = ((pc + delta) % 12);
      const down = ((pc - delta + 12) % 12);
      if (pcs.has(up)) return pitch + delta;
      if (pcs.has(down)) return pitch - delta;
    }
    return pitch; // fallback (should not happen)
  }, [allowedPitchClasses]);

  const snapPitchToScaleDirectional = useCallback((pitch: number, direction: number): number => {
    // direction: 1 for up, -1 for down
    const pcs = allowedPitchClasses();
    const pc = ((pitch % 12) + 12) % 12;
    if (pcs.has(pc)) return pitch;
    const step = direction >= 0 ? 1 : -1;
    for (let delta = 1; delta <= 12; delta++) {
      const candidate = pitch + step * delta;
      const candidatePc = ((candidate % 12) + 12) % 12;
      if (pcs.has(candidatePc)) return candidate;
    }
    return pitch;
  }, [allowedPitchClasses]);

  const quantizeTime = (timeSec: number, opts?: { snapToGrid?: boolean; fineGrid?: boolean }): number => {
    const shouldSnap = opts?.snapToGrid ?? (state.settings.snapToGrid ?? true);
    if (!shouldSnap) return Math.max(0, timeSec);
    const step = (opts?.fineGrid ? quantUnitSec / 4 : quantUnitSec);
    return Math.max(0, Math.round(timeSec / step) * step);
  };

  const getNoteFromPosition = (x: number, y: number, opts?: { chromatic?: boolean; fineGrid?: boolean }): MidiNote | null => {
    const noteY = Math.floor(y / noteHeight);
    let pitch = maxNote - noteY;
    // Snap to selected scale unless chromatic requested
    if ((state.settings.snapToScale ?? true) && !opts?.chromatic) {
      pitch = snapPitchToScale(pitch);
    }
    
    if (pitch < minNote || pitch > maxNote) return null;

    const startTimeRaw = (x / (beatWidth / 2));
    const startTime = quantizeTime(startTimeRaw, { fineGrid: opts?.fineGrid, snapToGrid: state.settings.snapToGrid });
    const duration = Math.max(quantUnitSec, 0.5); // Default duration, min quant

    return {
      id: '',
      pitch,
      startTime,
      duration,
      velocity: 0.8
    };
  };

  const findNoteAtPosition = (x: number, y: number): { note: MidiNote; resizeType: 'resize-start' | 'resize-end' | 'move' } | null => {
    for (const note of state.notes) {
      const noteY = (maxNote - note.pitch) * noteHeight;
      const noteX = note.startTime * (beatWidth / 2);
      const noteWidth = note.duration * (beatWidth / 2);

      if (y >= noteY && y <= noteY + noteHeight && x >= noteX && x <= noteX + noteWidth) {
        // Check if clicking near the start or end for resizing
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
  };

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
      const isNoteSelected = selectedNotes.has(foundNote.note.id) || state.selectedNoteId === foundNote.note.id;
      
      if (e.shiftKey) {
        // Add to selection with Shift
        const newSelection = new Set(selectedNotes);
        if (isNoteSelected) {
          newSelection.delete(foundNote.note.id);
        } else {
          newSelection.add(foundNote.note.id);
        }
        setSelectedNotes(newSelection);
        selectNote(foundNote.note.id);
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle selection with Ctrl/Cmd
        const newSelection = new Set(selectedNotes);
        if (isNoteSelected) {
          newSelection.delete(foundNote.note.id);
          if (newSelection.size === 0) {
            selectNote(null);
          }
        } else {
          newSelection.add(foundNote.note.id);
          selectNote(foundNote.note.id);
        }
        setSelectedNotes(newSelection);
      } else if (!isNoteSelected) {
        // Single selection
        setSelectedNotes(new Set([foundNote.note.id]));
        selectNote(foundNote.note.id);
      }
      
      setDragMode(foundNote.resizeType);
      dragOriginRef.current = { x, y, noteId: foundNote.note.id, original: { ...foundNote.note } };
    } else {
      // Start selection box if clicking on empty space
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
      // Complete selection box
      const { startX, startY, endX, endY } = selectionBox;
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      const selectedNoteIds = new Set<string>();
      
      state.notes.forEach(note => {
        const noteY = (maxNote - note.pitch) * noteHeight;
        const noteX = note.startTime * (beatWidth / 2);
        const noteWidth = note.duration * (beatWidth / 2);
        
        // Check if note intersects with selection box
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
      // Update selection box
      setSelectionBox(prev => prev ? {
        ...prev,
        endX: x,
        endY: y
      } : null);
      return;
    }

    if (dragMode === 'none' || !dragOriginRef.current) return;

    const origin = dragOriginRef.current;
    const note = state.notes.find(n => n.id === origin.noteId);
    if (!note) return;

    const deltaX = x - origin.x;
    const deltaY = y - origin.y;

    if (dragMode === 'move') {
      const semitoneSteps = Math.round(deltaY / noteHeight);
      const direction = semitoneSteps === 0 ? 0 : (semitoneSteps > 0 ? -1 : 1);
      const proposedPitch = origin.original.pitch - semitoneSteps;
      let snappedPitch = proposedPitch;
      const allowScaleSnap = (state.settings.snapToScale ?? true) && !e.altKey;
      if (allowScaleSnap) {
        if (direction !== 0) {
          snappedPitch = snapPitchToScaleDirectional(proposedPitch, direction);
        } else {
          snappedPitch = snapPitchToScale(proposedPitch);
        }
      }
      const clampedPitch = Math.max(minNote, Math.min(maxNote, snappedPitch));

      const startTimeRaw = origin.original.startTime + deltaX / (beatWidth / 2);
      const newStartTime = quantizeTime(Math.max(0, startTimeRaw), { fineGrid: e.shiftKey, snapToGrid: state.settings.snapToGrid });

      // If multiple notes are selected, move them all
      if (selectedNotes.size > 1 && selectedNotes.has(origin.noteId)) {
        const pitchDelta = clampedPitch - origin.original.pitch;
        const timeDelta = newStartTime - origin.original.startTime;
        
        selectedNotes.forEach(noteId => {
          const selectedNote = state.notes.find(n => n.id === noteId);
          if (selectedNote && noteId !== origin.noteId) {
            const newPitch = Math.max(minNote, Math.min(maxNote, selectedNote.pitch + pitchDelta));
            const newTime = Math.max(0, selectedNote.startTime + timeDelta);
            updateNote(noteId, {
              pitch: newPitch,
              startTime: newTime
            });
          }
        });
      }

      updateNote(origin.noteId, {
        pitch: clampedPitch,
        startTime: newStartTime
      });
    } else if (dragMode === 'resize-start') {
      const startTimeRaw = origin.original.startTime + deltaX / (beatWidth / 2);
      const newStartTime = quantizeTime(Math.max(0, startTimeRaw), { fineGrid: e.shiftKey, snapToGrid: state.settings.snapToGrid });
      const newDuration = Math.max(quantUnitSec / (e.shiftKey ? 4 : 1), origin.original.duration - (newStartTime - origin.original.startTime));

      updateNote(origin.noteId, {
        startTime: newStartTime,
        duration: newDuration
      });
    } else if (dragMode === 'resize-end') {
      const newDuration = Math.max(quantUnitSec / (e.shiftKey ? 4 : 1), quantizeTime(origin.original.duration + deltaX / (beatWidth / 2), { fineGrid: e.shiftKey, snapToGrid: state.settings.snapToGrid }));

      updateNote(origin.noteId, {
        duration: newDuration
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNote = getNoteFromPosition(x, y, { chromatic: e.altKey === true ? true : false, fineGrid: e.shiftKey === true });
    if (newNote) {
      addNote(newNote);
      // Subtle UI hint: brief overlay pulse where the note is added
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const noteY = (maxNote - newNote.pitch) * noteHeight;
          const noteX = newNote.startTime * (beatWidth / 2);
          const noteWidth = newNote.duration * (beatWidth / 2);
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#60a5fa';
          ctx.fillRect(noteX, noteY, noteWidth, noteHeight - 1);
          ctx.restore();
          // Fade the overlay out gently
          let opacity = 0.6;
          const fade = () => {
            if (!ctx) return;
            ctx.clearRect(noteX, noteY, noteWidth, noteHeight - 1);
            opacity -= 0.12;
            if (opacity <= 0) {
              draw();
              return;
            }
            ctx.save();
            ctx.globalAlpha = Math.max(opacity, 0);
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(noteX, noteY, noteWidth, noteHeight - 1);
            ctx.restore();
            requestAnimationFrame(fade);
          };
          requestAnimationFrame(fade);
        }
      }
    }
  };

  return (
    <div className="flex bg-gray-900 relative">
      {/* Piano Keyboard */}
      <div className="w-20 bg-gray-950 border-r border-gray-800 relative">
        <div className="h-full overflow-hidden">
          {Array.from({ length: noteRange }, (_, i) => {
            const pitch = maxNote - i;
            const noteName = getNoteName(pitch);
            const isBlackKey = noteName.includes('#');
            const isInScale = allowedPitchClasses().has(pitch % 12);
            
            return (
              <div
                key={pitch}
                className={`flex items-center justify-center text-xs font-semibold border-b border-gray-800 transition-all duration-150 relative ${
                  isBlackKey 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-gray-900 text-gray-200 hover:bg-gray-800'
                } ${
                  isInScale ? 'ring-1 ring-indigo-500/30' : ''
                }`}
                style={{ height: noteHeight }}
                  onClick={() => {
                    // Play note preview on click
                    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                  
                  oscillator.connect(gainNode);
                  gainNode.connect(audioContext.destination);
                  
                  oscillator.frequency.value = 440 * Math.pow(2, (pitch - 69) / 12);
                  oscillator.type = 'sine';
                  
                  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                  
                  oscillator.start();
                  oscillator.stop(audioContext.currentTime + 0.5);
                }}
              >
                {noteName}
                {isInScale && (
                  <div className="absolute right-1 w-1 h-1 bg-indigo-400 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Scale indicator */}
        <div className="absolute bottom-2 left-1 right-1 text-center">
          <div className="text-[10px] text-gray-400 bg-gray-800/80 rounded px-1 py-0.5">
            {state.rootNote}
          </div>
        </div>
      </div>

      {/* Piano Roll Canvas */}
      <div className="flex-1 relative bg-gray-900">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block cursor-crosshair focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onDoubleClick={handleDoubleClick}
          tabIndex={0}
        />
        
        {/* Enhanced info overlay */}
        <div className="absolute top-2 right-2 space-y-2">
          <div className="bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm border border-gray-700/50">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">{selectedNotes.size || (state.selectedNoteId ? 1 : 0)} selected</span>
            </div>
            <div className="text-gray-300 space-y-1">
              <div>Double-click: Add notes</div>
              <div>Drag: Move • Edges: Resize</div>
              <div>Shift: Multi-select • Ctrl+A: Select all</div>
            </div>
          </div>
          
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm border border-gray-700/50 hover:bg-black/80 transition-colors"
          >
            ?
          </button>
        </div>
        
        {/* Help overlay */}
        {showHelp && (
          <div className="absolute inset-4 bg-black/90 backdrop-blur-md rounded-xl border border-gray-700 p-6 text-white z-10">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold">Piano Roll Shortcuts</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-3 text-indigo-400">Note Editing</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Add note</span>
                    <span className="text-gray-400">Double-click</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delete note</span>
                    <span className="text-gray-400">Delete / Backspace</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Move note</span>
                    <span className="text-gray-400">Drag</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resize note</span>
                    <span className="text-gray-400">Drag edges</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-purple-400">Selection</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Select multiple</span>
                    <span className="text-gray-400">Shift + Click</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toggle selection</span>
                    <span className="text-gray-400">Ctrl + Click</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Select all</span>
                    <span className="text-gray-400">Ctrl + A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Box select</span>
                    <span className="text-gray-400">Drag empty space</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-green-400">Copy/Paste</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Copy</span>
                    <span className="text-gray-400">Ctrl + C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paste</span>
                    <span className="text-gray-400">Ctrl + V</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-yellow-400">Modifiers</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Chromatic mode</span>
                    <span className="text-gray-400">Hold Alt</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fine grid</span>
                    <span className="text-gray-400">Hold Shift</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clear selection</span>
                    <span className="text-gray-400">Escape</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
