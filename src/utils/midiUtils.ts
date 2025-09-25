import { MidiNote, RootNote, ScaleType } from '@/types';

export const ROOT_NOTES: RootNote[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALE_TYPES: ScaleType[] = [
  'Major',
  'Minor', 
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Harmonic Minor'
];

export const getMidiNoteNumber = (note: RootNote, octave: number = 4): number => {
  const noteMap: Record<RootNote, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  return noteMap[note] + (octave * 12);
};

export const getNoteName = (midiNumber: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const note = noteNames[midiNumber % 12];
  return `${note}${octave}`;
};

export const getScaleIntervals = (scaleType: ScaleType): number[] => {
  const scaleMap: Record<ScaleType, number[]> = {
    'Major': [0, 2, 4, 5, 7, 9, 11],
    'Minor': [0, 2, 3, 5, 7, 8, 10],
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10],
    'Lydian': [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11]
  };
  return scaleMap[scaleType] || scaleMap['Major'];
};

// Classify notes into simple roles for preview rendering
export type NoteRole = 'chord' | 'melody' | 'bass' | 'arp';

export interface SegmentedNotes {
  chord: MidiNote[];
  melody: MidiNote[];
  bass: MidiNote[];
  arp: MidiNote[];
}

// Enhanced musical pattern recognition:
// - Chord: 3+ notes playing simultaneously (within 50ms) with similar durations
// - Melody: Single-note melodic lines, typically in upper register
// - Bass: Low register patterns (< 60 MIDI), often rhythmic movement
// - Arp: Sequential notes forming broken chord patterns or rapid scales
export function segmentNotesForPreview(notes: MidiNote[]): SegmentedNotes {
  const chord: MidiNote[] = [];
  const melody: MidiNote[] = [];
  const bass: MidiNote[] = [];
  const arp: MidiNote[] = [];

  if (!notes || notes.length === 0) {
    return { chord, melody, bass, arp };
  }

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime || a.pitch - b.pitch);
  
  // Define pitch ranges
  const BASS_THRESHOLD = 60; // C4 - notes below this are bass candidates
  const MELODY_THRESHOLD = 65; // F4 - notes above this are melody candidates
  const CHORD_SIMULTANEITY_WINDOW = 0.05; // 50ms window for "simultaneous" notes
  const SHORT_NOTE_THRESHOLD = 0.4; // Notes shorter than this might be arp/melody
  
  // Group notes by start time (with small tolerance for "simultaneous" notes)
  const timeGroups: Record<string, MidiNote[]> = {};
  
  for (const note of sorted) {
    // Round start time to nearest 50ms for grouping
    const roundedTime = Math.round(note.startTime / CHORD_SIMULTANEITY_WINDOW) * CHORD_SIMULTANEITY_WINDOW;
    const timeKey = roundedTime.toFixed(2);
    
    if (!timeGroups[timeKey]) timeGroups[timeKey] = [];
    timeGroups[timeKey].push(note);
  }
  
  // Analyze each time group
  Object.values(timeGroups).forEach(groupNotes => {
    if (groupNotes.length === 0) return;
    
    // Sort by pitch within group
    groupNotes.sort((a, b) => a.pitch - b.pitch);
    
    if (groupNotes.length >= 3) {
      // 3+ simultaneous notes = likely a chord
      // Check if durations are similar (within 50% of each other)
      const avgDuration = groupNotes.reduce((sum, n) => sum + n.duration, 0) / groupNotes.length;
      const durationsAreSimilar = groupNotes.every(n => 
        Math.abs(n.duration - avgDuration) / avgDuration < 0.5
      );
      
      if (durationsAreSimilar && avgDuration >= 0.5) {
        // This is a chord
        chord.push(...groupNotes);
        return;
      }
    }
    
    // For smaller groups or non-chord patterns, classify individually
    for (const note of groupNotes) {
      if (note.pitch < BASS_THRESHOLD) {
        // Low notes go to bass
        bass.push(note);
      } else if (note.duration < SHORT_NOTE_THRESHOLD) {
        // Short notes in upper register - check if part of arpeggio pattern
        const timeWindow = 1.0; // 1 second window to look for arp patterns
        const windowStart = note.startTime;
        const windowEnd = windowStart + timeWindow;
        
        const nearbyShortNotes = sorted.filter(n => 
          n.startTime >= windowStart && 
          n.startTime <= windowEnd && 
          n.duration < SHORT_NOTE_THRESHOLD &&
          Math.abs(n.pitch - note.pitch) <= 24 // Within 2 octaves
        );
        
        // If there are 4+ short notes in this time window with varied pitches, it's likely an arp
        const uniquePitches = new Set(nearbyShortNotes.map(n => n.pitch));
        if (nearbyShortNotes.length >= 4 && uniquePitches.size >= 3) {
          arp.push(note);
        } else {
          // Otherwise it's melody
          melody.push(note);
        }
      } else {
        // Longer notes in upper register
        if (note.pitch >= MELODY_THRESHOLD) {
          melody.push(note);
        } else {
          // Mid-range sustained notes - could be chord tones or bass
          const hasSimultaneousNotes = sorted.some(other => 
            other !== note &&
            Math.abs(other.startTime - note.startTime) < CHORD_SIMULTANEITY_WINDOW
          );
          
          if (hasSimultaneousNotes) {
            chord.push(note);
          } else {
            bass.push(note);
          }
        }
      }
    }
  });
  
  // Post-process: Clean up misclassified patterns
  
  // If we have very few chord notes but many bass notes, some bass notes might actually be chords
  if (chord.length < 3 && bass.length > 6) {
    const bassNotesToMove = bass.filter(n => n.pitch >= 50 && n.duration >= 1.0);
    if (bassNotesToMove.length >= 3) {
      chord.push(...bassNotesToMove);
      bassNotesToMove.forEach(moveNote => {
        const index = bass.indexOf(moveNote);
        if (index > -1) bass.splice(index, 1);
      });
    }
  }
  
  // If arp section is empty but we have many short melody notes, some might be arps
  if (arp.length === 0 && melody.length > 8) {
    const shortMelodyNotes = melody.filter(n => n.duration < 0.3);
    if (shortMelodyNotes.length >= 6) {
      // Look for sequential patterns
      shortMelodyNotes.sort((a, b) => a.startTime - b.startTime);
      const sequentialArp: MidiNote[] = [];
      
      for (let i = 0; i < shortMelodyNotes.length - 2; i++) {
        const current = shortMelodyNotes[i];
        const next1 = shortMelodyNotes[i + 1];
        const next2 = shortMelodyNotes[i + 2];
        
        // Check if these form a sequence (timing and pitch)
        const timingGap1 = next1.startTime - current.startTime;
        const timingGap2 = next2.startTime - next1.startTime;
        const pitchDiff1 = Math.abs(next1.pitch - current.pitch);
        const pitchDiff2 = Math.abs(next2.pitch - next1.pitch);
        
        if (timingGap1 < 0.5 && timingGap2 < 0.5 && pitchDiff1 <= 12 && pitchDiff2 <= 12) {
          if (!sequentialArp.includes(current)) sequentialArp.push(current);
          if (!sequentialArp.includes(next1)) sequentialArp.push(next1);
          if (!sequentialArp.includes(next2)) sequentialArp.push(next2);
        }
      }
      
      if (sequentialArp.length >= 4) {
        arp.push(...sequentialArp);
        sequentialArp.forEach(moveNote => {
          const index = melody.indexOf(moveNote);
          if (index > -1) melody.splice(index, 1);
        });
      }
    }
  }

  return { chord, melody, bass, arp };
}

export interface MiniRollDimensions {
  width: number;
  height: number;
  noteHeight: number; // visual height per semitone
  beatWidth: number;  // visual width per beat
}

export interface MiniRollStyle {
  top: string;      // gradient start
  bottom: string;   // gradient end
  border: string;   // border color
  glow: string;     // rgba glow color
}

export interface MiniRollDrawOptions {
  style?: MiniRollStyle;
  hoverX?: number | null;
  showBarNumbers?: boolean;
}

export function drawMiniPianoRoll(
  ctx: CanvasRenderingContext2D,
  dims: MiniRollDimensions,
  notes: MidiNote[],
  theme: 'light' | 'dark',
  options: MiniRollDrawOptions = {}
) {
  const { width, height, noteHeight, beatWidth } = dims;
  const minNote = 48; // C3
  const maxNote = 84; // C6
  const noteRange = maxNote - minNote + 1;
  const beatsPerBar = 4;
  const bars = 4; // compact view
  const totalBeats = beatsPerBar * bars;
  const gridWidth = totalBeats * beatWidth;

  // Helpers
  const isDark = true; // force dark preview regardless of state for consistency
  const backgroundColor = '#0b0f18';
  const rowEvenColor = '#0e1422';
  const rowOddColor = '#0b0f18';
  const gridMinor = '#182235';
  const gridMajor = '#334155';
  const noteFillBase = options.style?.top ?? '#22c55e';
  const noteFillAlt = options.style?.bottom ?? '#16a34a';
  const noteBorder = options.style?.border ?? '#10b981';
  const noteGlow = options.style?.glow ?? 'rgba(34,197,94,0.35)';

  const isBlack = (midi: number) => {
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

  // Clear and background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = isDark ? backgroundColor : '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Row shading (piano key stripes) - use gridWidth for content area only
  for (let i = 0; i < noteRange; i++) {
    const pitch = maxNote - i;
    const y = i * noteHeight;
    const shade = isBlack(pitch) ? rowEvenColor : rowOddColor;
    ctx.fillStyle = shade;
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
  for (let b = 0; b <= totalBeats; b++) {
    const x = b * beatWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Bar lines (thicker)
  ctx.strokeStyle = gridMajor;
  ctx.lineWidth = 2;
  for (let bar = 0; bar < bars; bar++) {
    const x = bar * beatsPerBar * beatWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Bar numbers / ruler
  if (options.showBarNumbers) {
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter';
    ctx.textBaseline = 'top';
    for (let bar = 0; bar < bars; bar++) {
      const x = bar * beatsPerBar * beatWidth + 4;
      ctx.fillText(String(bar + 1), x, 2);
    }
    ctx.restore();
  }

  // Draw notes (rounded, gradient, glow)
  for (const n of notes) {
    const y = (maxNote - n.pitch) * noteHeight + 0.5;
    const x = n.startTime * (beatWidth / 2);
    const w = Math.max(2, n.duration * (beatWidth / 2));
    const h = Math.max(2, noteHeight - 2);

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, noteFillBase);
    grad.addColorStop(1, noteFillAlt);
    ctx.fillStyle = grad;

    // Glow
    ctx.save();
    ctx.shadowColor = noteGlow;
    ctx.shadowBlur = 8;
    roundedRect(x, y, w, h, 4);
    ctx.fill();
    ctx.restore();

    // Border
    ctx.lineWidth = 1;
    ctx.strokeStyle = noteBorder;
    roundedRect(x, y, w, h, 4);
    ctx.stroke();
  }

  // Hover scrub line
  if (options.hoverX !== undefined && options.hoverX !== null) {
    const x = Math.max(0, Math.min(gridWidth - 1, options.hoverX));
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.restore();
  }
}
