import * as Tone from 'tone';
import { MidiNote } from '@/types';

export class AudioService {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Tone.js
      await Tone.start();
      
      // Create a polyphonic synthesizer
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sawtooth'
        },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.5,
          release: 0.8
        }
      }).toDestination();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  async playNotes(notes: MidiNote[]) {
    if (!this.synth || !this.isInitialized) {
      await this.initialize();
    }

    if (!this.synth) return;

    // Stop any currently playing notes
    this.synth.releaseAll();

    // Schedule notes to play
    notes.forEach(note => {
      const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();
      this.synth!.triggerAttackRelease(
        frequency,
        note.duration,
        note.startTime,
        note.velocity
      );
    });
  }

  async playSequence(notes: MidiNote[], onTimeUpdate?: (time: number) => void) {
    if (!this.synth || !this.isInitialized) {
      await this.initialize();
    }

    if (!this.synth) return;

    // Stop any currently playing sequence
    Tone.Transport.stop();
    Tone.Transport.cancel();

    // Schedule notes
    notes.forEach(note => {
      const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();
      Tone.Transport.schedule((time) => {
        this.synth!.triggerAttackRelease(
          frequency,
          note.duration,
          time,
          note.velocity
        );
      }, note.startTime);
    });

    // Set up time update callback
    if (onTimeUpdate) {
      Tone.Transport.scheduleRepeat((time) => {
        onTimeUpdate(time);
      }, '16n');
    }

    // Start playback
    Tone.Transport.start();
  }

  stop() {
    if (this.synth) {
      this.synth.releaseAll();
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }

  pause() {
    Tone.Transport.pause();
  }

  resume() {
    Tone.Transport.start();
  }

  getCurrentTime(): number {
    return Tone.Transport.seconds;
  }

  async exportWAV(notes: MidiNote[]): Promise<Blob> {
    if (!this.synth || !this.isInitialized) {
      await this.initialize();
    }

    if (!this.synth) return new Blob();

    // Create offline context for rendering
    const offlineContext = new Tone.OfflineContext(2, 10, 44100);
    const offlineSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8
      }
    }).connect(offlineContext.destination);

    // Schedule notes in offline context
    notes.forEach(note => {
      const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();
      offlineSynth.triggerAttackRelease(
        frequency,
        note.duration,
        note.startTime,
        note.velocity
      );
    });

    // Render the audio
    const buffer = await offlineContext.render();
    
    // Convert to WAV
    const wavBuffer = this.bufferToWav(buffer.get() as AudioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  private bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }
}
