import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { MidiNote, PianoRollDimensions, RootNote, ScaleType } from '@/types';
import { getNoteName, getScaleIntervals, getMidiNoteNumber } from '@/utils/midiUtils';

interface PianoRollProps {
  dimensions: PianoRollDimensions;
}

export default function PianoRoll({ dimensions }: PianoRollProps) {
  const { state, addNote, updateNote, deleteNote, selectNote } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  type DragMode = 'move' | 'resize-start' | 'resize-end' | 'none';
  const [dragMode, setDragMode] = useState<DragMode>('none');
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

      const isSelected = state.selectedNoteId === note.id;
      const grad = ctx.createLinearGradient(noteX, noteY, noteX, noteY + noteHeightPx);
      if (isSelected) {
        grad.addColorStop(0, blueTop);
        grad.addColorStop(1, blueBottom);
      } else {
        grad.addColorStop(0, greenTop);
        grad.addColorStop(1, greenBottom);
      }
      ctx.fillStyle = grad;

      // Glow
      ctx.save();
      ctx.shadowColor = isSelected ? 'rgba(59,130,246,0.45)' : 'rgba(34,197,94,0.35)';
      ctx.shadowBlur = 10;
      roundedRect(noteX, noteY, noteWidth, noteHeightPx, 5);
      ctx.fill();
      ctx.restore();

      // Border
      ctx.lineWidth = 1;
      ctx.strokeStyle = isSelected ? noteBorder : noteBorderGreen;
      roundedRect(noteX, noteY, noteWidth, noteHeightPx, 5);
      ctx.stroke();
    });

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
    
    if (foundNote) {
      setDragMode(foundNote.resizeType);
      dragOriginRef.current = { x, y, noteId: foundNote.note.id, original: { ...foundNote.note } };
      selectNote(foundNote.note.id);
    } else {
      selectNote(null);
    }
  };

  const handleMouseUp = () => {
    setDragMode('none');
    dragOriginRef.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragMode === 'none' || !dragOriginRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedNoteId) {
      deleteNote(state.selectedNoteId);
    }
  };

  return (
    <div className="flex bg-gray-900">
      {/* Piano Keyboard */}
      <div className="w-20 bg-gray-950 border-r border-gray-800">
        <div className="h-full overflow-hidden">
          {Array.from({ length: noteRange }, (_, i) => {
            const pitch = maxNote - i;
            const noteName = getNoteName(pitch);
            const isBlackKey = noteName.includes('#');
            
            return (
              <div
                key={pitch}
                className={`flex items-center justify-center text-xs font-semibold border-b border-gray-800 transition-colors duration-150 ${
                  isBlackKey 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-gray-900 text-gray-200 hover:bg-gray-800'
                }`}
                style={{ height: noteHeight }}
              >
                {noteName}
              </div>
            );
          })}
        </div>
      </div>

      {/* Piano Roll Canvas */}
      <div className="flex-1 relative bg-gray-900">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        />
        
        {/* Grid overlay info */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur">
          Double-click to add notes • Drag to move • Resize edges
        </div>
      </div>
    </div>
  );
}
