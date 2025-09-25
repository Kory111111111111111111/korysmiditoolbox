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

// Heuristic segmentation:
// - Bass: lowest pitch within each time slice (bar) if sustained <= 2 simultaneous voices
// - Melody: highest pitch lines with relatively shorter durations and later start times
// - Arp: sequences of short notes (< 0.35s) within a bar spanning multiple pitches
// - Chord: remaining sustained notes (>= 0.35s) that overlap in time
export function segmentNotesForPreview(notes: MidiNote[]): SegmentedNotes {
  const chord: MidiNote[] = [];
  const melody: MidiNote[] = [];
  const bass: MidiNote[] = [];
  const arp: MidiNote[] = [];

  if (!notes || notes.length === 0) {
    return { chord, melody, bass, arp };
  }

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime || a.pitch - b.pitch);

  // Group by bar (assuming 120bpm, 0.5s per beat, 4 beats per bar => 2s bar)
  const barLengthSec = 2; // 4 beats * 0.5s
  const bars: Record<number, MidiNote[]> = {};
  for (const n of sorted) {
    const barIndex = Math.floor(n.startTime / (barLengthSec));
    if (!bars[barIndex]) bars[barIndex] = [];
    bars[barIndex].push(n);
  }

  Object.values(bars).forEach(barNotes => {
    if (barNotes.length === 0) return;

    // Identify short notes (candidate arp/melody)
    const shortNotes = barNotes.filter(n => n.duration < 0.35);
    const longNotes = barNotes.filter(n => n.duration >= 0.35);

    // Arp: sequences of short notes spanning at least 3 distinct pitches
    const distinctShortPitches = new Set(shortNotes.map(n => n.pitch));
    const isArpBar = distinctShortPitches.size >= 3 && shortNotes.length >= 3;
    if (isArpBar) {
      arp.push(...shortNotes);
    } else {
      // Treat short notes as melody candidates
      melody.push(...shortNotes);
    }

    // From remaining long notes, pick lowest as bass if reasonably low
    if (longNotes.length > 0) {
      const lowest = longNotes.reduce((min, n) => (n.pitch < min.pitch ? n : min), longNotes[0]);
      bass.push(lowest);
      const withoutLowest = longNotes.filter(n => n !== lowest);
      chord.push(...withoutLowest);
    }
  });

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

  // Row shading (piano key stripes)
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
  for (let bar = 0; bar <= bars; bar++) {
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
