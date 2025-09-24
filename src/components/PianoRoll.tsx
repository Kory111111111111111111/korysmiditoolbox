import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { MidiNote, PianoRollDimensions } from '@/types';
import { getNoteName } from '@/utils/midiUtils';

interface PianoRollProps {
  dimensions: PianoRollDimensions;
}

export default function PianoRoll({ dimensions }: PianoRollProps) {
  const { state, addNote, updateNote, deleteNote, selectNote } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);

  const { width, height, noteHeight, beatWidth } = dimensions;
  const beatsPerBar = 4;
  const bars = 8;
  const totalBeats = bars * beatsPerBar;
  const gridWidth = totalBeats * beatWidth;

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

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up drawing styles
    ctx.fillStyle = state.settings.theme === 'dark' ? '#1f2937' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = state.settings.theme === 'dark' ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;

    // Draw horizontal lines (note lines)
    for (let i = 0; i <= noteRange; i++) {
      const y = i * noteHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gridWidth, y);
      ctx.stroke();
    }

    // Draw vertical lines (beat lines)
    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = beat * beatWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pianoHeight);
      ctx.stroke();
    }

    // Draw bar lines (thicker)
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.settings.theme === 'dark' ? '#6b7280' : '#9ca3af';
    for (let bar = 0; bar <= bars; bar++) {
      const x = bar * beatsPerBar * beatWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pianoHeight);
      ctx.stroke();
    }

    // Draw notes
    state.notes.forEach(note => {
      const noteY = (maxNote - note.pitch) * noteHeight;
      const noteX = note.startTime * (beatWidth / 2); // Assuming 120 BPM
      const noteWidth = note.duration * (beatWidth / 2);

      // Note color based on velocity and selection
      const isSelected = state.selectedNoteId === note.id;
      const opacity = note.velocity;
      const baseColor = isSelected ? '#3b82f6' : '#10b981';
      
      ctx.fillStyle = `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.fillRect(noteX, noteY, noteWidth, noteHeight - 1);

      // Draw note border
      ctx.strokeStyle = isSelected ? '#1d4ed8' : '#059669';
      ctx.lineWidth = 1;
      ctx.strokeRect(noteX, noteY, noteWidth, noteHeight - 1);
    });

    // Draw playhead
    if (state.isPlaying) {
      const playheadX = state.currentTime * (beatWidth / 2);
      ctx.strokeStyle = '#ef4444';
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

  const getNoteFromPosition = (x: number, y: number): MidiNote | null => {
    const noteY = Math.floor(y / noteHeight);
    const pitch = maxNote - noteY;
    
    if (pitch < minNote || pitch > maxNote) return null;

    const startTime = (x / (beatWidth / 2));
    const duration = 0.5; // Default duration

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
        const resizeThreshold = 8;
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
      setIsDragging(true);
      setDraggedNote(foundNote.note.id);
      setDragType(foundNote.resizeType);
      setDragStart({ x, y });
      selectNote(foundNote.note.id);
    } else {
      selectNote(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNote(null);
    setDragType(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedNote) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const note = state.notes.find(n => n.id === draggedNote);
    if (!note) return;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    if (dragType === 'move') {
      const newPitch = Math.max(minNote, Math.min(maxNote, note.pitch - Math.round(deltaY / noteHeight)));
      const newStartTime = Math.max(0, note.startTime + deltaX / (beatWidth / 2));
      
      updateNote(draggedNote, {
        pitch: newPitch,
        startTime: newStartTime
      });
    } else if (dragType === 'resize-start') {
      const newStartTime = Math.max(0, note.startTime + deltaX / (beatWidth / 2));
      const newDuration = Math.max(0.1, note.duration - (newStartTime - note.startTime));
      
      updateNote(draggedNote, {
        startTime: newStartTime,
        duration: newDuration
      });
    } else if (dragType === 'resize-end') {
      const newDuration = Math.max(0.1, note.duration + deltaX / (beatWidth / 2));
      
      updateNote(draggedNote, {
        duration: newDuration
      });
    }

    setDragStart({ x, y });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNote = getNoteFromPosition(x, y);
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
    <div className="flex bg-white dark:bg-gray-900">
      {/* Piano Keyboard */}
      <div className="w-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="h-full overflow-hidden">
          {Array.from({ length: noteRange }, (_, i) => {
            const pitch = maxNote - i;
            const noteName = getNoteName(pitch);
            const isBlackKey = noteName.includes('#');
            
            return (
              <div
                key={pitch}
                className={`flex items-center justify-center text-xs font-semibold border-b border-gray-200 dark:border-gray-700 transition-colors duration-150 ${
                  isBlackKey 
                    ? 'bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600' 
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750'
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
      <div className="flex-1 relative bg-white dark:bg-gray-900">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair block"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        />
        
        {/* Grid overlay info */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          Double-click to add notes • Drag to move • Resize edges
        </div>
      </div>
    </div>
  );
}
