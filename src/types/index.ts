export interface MidiNote {
  id: string;
  pitch: number; // MIDI note number (0-127)
  startTime: number; // in seconds
  duration: number; // in seconds
  velocity: number; // 0-1
}

export interface AppSettings {
  apiKey: string;
  theme: 'light' | 'dark';
  snapToGrid?: boolean;
  snapToScale?: boolean;
}

export interface AppState {
  notes: MidiNote[];
  selectedNoteId: string | null;
  isPlaying: boolean;
  currentTime: number;
  rootNote: string;
  scaleType: string;
  settings: AppSettings;
  editingSection: SectionType;
}

export interface PianoRollDimensions {
  width: number;
  height: number;
  noteHeight: number;
  beatWidth: number;
}

export type RootNote = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type ScaleType = 'Major' | 'Minor' | 'Dorian' | 'Phrygian' | 'Lydian' | 'Mixolydian' | 'Harmonic Minor';

export type SectionType = 'all' | 'chord' | 'melody' | 'bass' | 'arp';

export interface ChordProgressionRequest {
  rootNote: RootNote;
  scaleType: ScaleType;
  chordCount?: number;
}
