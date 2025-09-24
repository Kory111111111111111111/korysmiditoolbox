import MidiWriter from 'midi-writer-js';
import { MidiNote } from '@/types';

export class MidiExportService {
  exportMIDI(notes: MidiNote[]): Blob {
    const track = new MidiWriter.Track();

    // Sort notes by start time
    const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);

    // Group notes by start time to create chords
    const noteGroups = new Map<number, MidiNote[]>();
    
    sortedNotes.forEach(note => {
      const timeKey = Math.round(note.startTime * 1000); // Round to milliseconds
      if (!noteGroups.has(timeKey)) {
        noteGroups.set(timeKey, []);
      }
      noteGroups.get(timeKey)!.push(note);
    });

    // Add notes to track
    noteGroups.forEach((noteGroup, timeKey) => {
      const startTime = timeKey / 1000; // Convert back to seconds
      const duration = Math.max(...noteGroup.map(n => n.duration));
      
      // Convert MIDI notes to note names
      const noteNames = noteGroup.map(note => {
        const noteName = this.midiToNoteName(note.pitch);
        return {
          pitch: noteName,
          duration: this.durationToMidiWriter(note.duration),
          velocity: Math.round(note.velocity * 127)
        };
      });

      // Add chord event
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: noteNames.map(n => n.pitch),
        duration: this.durationToMidiWriter(duration),
        velocity: Math.round(noteGroup[0].velocity * 127),
        startTick: this.timeToTicks(startTime)
      }));
    });

    // Create MIDI file
    const writer = new MidiWriter.Writer([track]);
    const midiData = writer.buildFile();
    
    return new Blob([midiData as BlobPart], { type: 'audio/midi' });
  }

  private midiToNoteName(midiNumber: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    const note = noteNames[midiNumber % 12];
    return `${note}${octave}`;
  }

  private durationToMidiWriter(duration: number): string {
    // Convert seconds to MIDI writer duration format
    // Assuming 120 BPM (0.5 seconds per beat)
    const beats = duration / 0.5;
    
    if (beats <= 0.25) return '16';
    if (beats <= 0.5) return '8';
    if (beats <= 1) return '4';
    if (beats <= 2) return '2';
    if (beats <= 4) return '1';
    return '1'; // Default to whole note
  }

  private timeToTicks(time: number): number {
    // Convert seconds to MIDI ticks
    // Assuming 120 BPM and 480 ticks per quarter note
    const beats = time / 0.5; // 0.5 seconds per beat at 120 BPM
    return Math.round(beats * 480);
  }
}
