import { MidiNote } from '@/types';

// Default C Major chord progression: C - Am - F - G (adjusted for C4-C6 range)
export const getDefaultProgression = (): MidiNote[] => {
  const notes: MidiNote[] = [];
  const chordDuration = 2; // 2 seconds per chord
  const chordVelocity = 0.8;
  
  // C Major chord (C4, E4, G4)
  notes.push(
    { id: 'default-1', pitch: 60, startTime: 0, duration: chordDuration, velocity: chordVelocity },
    { id: 'default-2', pitch: 64, startTime: 0, duration: chordDuration, velocity: chordVelocity },
    { id: 'default-3', pitch: 67, startTime: 0, duration: chordDuration, velocity: chordVelocity }
  );
  
  // A Minor chord (A4, C5, E5)
  notes.push(
    { id: 'default-4', pitch: 69, startTime: 2, duration: chordDuration, velocity: chordVelocity },
    { id: 'default-5', pitch: 72, startTime: 2, duration: chordDuration, velocity: chordVelocity },
    { id: 'default-6', pitch: 76, startTime: 2, duration: chordDuration, velocity: chordVelocity }
  );
  
  // F Major chord (F4, A4, C5)
  notes.push(
    { id: 'default-7', pitch: 65, startTime: 4, duration: chordDuration, velocity: chordVelocity },
    { id: 'default-8', pitch: 69, startTime: 4, duration: chordDuration, velocity: chordVelocity },
    { id: 'default-9', pitch: 72, startTime: 4, duration: chordDuration, velocity: chordVelocity }
  );
  
  // G Major chord (G4, B4, D5)
  notes.push(
    { id: 'default-10', pitch: 67, startTime: 6, duration: chordDuration, velocity: chordVelocity },
    { id: 'default-11', pitch: 71, startTime: 6, duration: chordDuration, velocity: chordVelocity },
    { id: 'default-12', pitch: 74, startTime: 6, duration: chordDuration, velocity: chordVelocity }
  );
  
  return notes;
};
