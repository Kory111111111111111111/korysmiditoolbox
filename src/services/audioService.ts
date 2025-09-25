import * as Tone from 'tone';
import { MidiNote, SectionType } from '@/types';
import { segmentNotesForPreview } from '@/utils/midiUtils';

export interface TrackConfig {
  id: SectionType;
  instrument: Tone.PolySynth;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  gainNode: Tone.Gain;
  panNode: Tone.Panner;
  effectsChain: Tone.ToneAudioNode[];
}

export interface PlaybackOptions {
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  metronome: boolean;
  countIn: number;
  tempo: number;
}

export interface AudioLevels {
  [key: string]: number;
}

export class AudioService {
  private tracks: Map<SectionType, TrackConfig> = new Map();
  private masterGain: Tone.Gain | null = null;
  private metronome: Tone.PolySynth | null = null;
  private playbackOptions: PlaybackOptions = {
    loop: false,
    loopStart: 0,
    loopEnd: 16, // 4 bars at 4 beats per bar
    metronome: false,
    countIn: 0,
    tempo: 120
  };
  private audioLevels: AudioLevels = {};
  private levelUpdateCallback: ((levels: AudioLevels) => void) | null = null;
  private isInitialized = false;
  private currentLoopId: number | null = null;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Tone.js
      await Tone.start();
      
      // Set initial transport BPM
      Tone.Transport.bpm.value = this.playbackOptions.tempo;
      
      // Create master gain
      this.masterGain = new Tone.Gain(0.8).toDestination();
      
      // Initialize tracks for each section
      await this.initializeTracks();
      
      // Initialize metronome
      this.metronome = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
      });
      const metronomeGain = new Tone.Gain(0.3);
      this.metronome.connect(metronomeGain);
      metronomeGain.connect(this.masterGain!);
      
      // Start level monitoring
      this.startLevelMonitoring();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  private async initializeTracks() {
    const trackConfigs = [
      {
        id: 'chord' as SectionType,
        synthConfig: {
          oscillator: { type: 'sine' as const },
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 1.2 }
        },
        effects: ['reverb']
      },
      {
        id: 'melody' as SectionType,
        synthConfig: {
          oscillator: { type: 'sawtooth' as const },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.8 }
        },
        effects: ['delay']
      },
      {
        id: 'bass' as SectionType,
        synthConfig: {
          oscillator: { type: 'triangle' as const },
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 }
        },
        effects: ['eq']
      },
      {
        id: 'arp' as SectionType,
        synthConfig: {
          oscillator: { type: 'square' as const },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.3 }
        },
        effects: ['filter']
      }
    ];

    for (const config of trackConfigs) {
      const instrument = new Tone.PolySynth(Tone.Synth, config.synthConfig);
      const gainNode = new Tone.Gain(0.8);
      const panNode = new Tone.Panner(0);
      
      // Create effects chain
      const effectsChain = this.createEffectsChain(config.effects);
      
      // Connect audio chain
      instrument.connect(gainNode);
      gainNode.connect(panNode);
      
      if (effectsChain.length > 0) {
        panNode.connect(effectsChain[0]);
        effectsChain[effectsChain.length - 1].connect(this.masterGain!);
      } else {
        panNode.connect(this.masterGain!);
      }
      
      this.tracks.set(config.id, {
        id: config.id,
        instrument,
        volume: 80,
        pan: 0,
        muted: false,
        soloed: false,
        gainNode,
        panNode,
        effectsChain
      });
      
      this.audioLevels[config.id] = 0;
    }
  }

  private createEffectsChain(effects: string[]): Tone.ToneAudioNode[] {
    const chain: Tone.ToneAudioNode[] = [];
    
    effects.forEach(effectType => {
      switch (effectType) {
        case 'reverb':
          const reverb = new Tone.Reverb(2); // decay time in seconds
          chain.push(reverb);
          break;
        case 'delay':
          const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3 });
          chain.push(delay);
          break;
        case 'eq':
          const eq = new Tone.EQ3({ low: 2, mid: 0, high: -2 });
          chain.push(eq);
          break;
        case 'filter':
          const filter = new Tone.Filter({ frequency: 1000, type: 'lowpass' });
          chain.push(filter);
          break;
      }
    });
    
    return chain;
  }

  private startLevelMonitoring() {
    const updateLevels = () => {
      this.tracks.forEach((track, sectionId) => {
        // Simple level calculation based on gain node
        const volume = track.muted ? 0 : (track.volume / 100) * (track.soloed || !this.hasSoloedTracks() ? 1 : 0);
        this.audioLevels[sectionId] = volume * 0.8; // Simulate audio level
      });
      
      if (this.levelUpdateCallback) {
        this.levelUpdateCallback(this.audioLevels);
      }
    };
    
    // Update levels at 30fps when playing
    setInterval(() => {
      if (Tone.Transport.state === 'started') {
        updateLevels();
      }
    }, 1000 / 30);
  }

  async playNotes(notes: MidiNote[], sectionFilter?: SectionType[]) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Stop any currently playing notes
    this.stopAllTracks();

    // Group notes by section
    const notesBySection = this.groupNotesBySection(notes);
    
    // Schedule notes for each section
    notesBySection.forEach((sectionNotes, sectionId) => {
      if (sectionFilter && !sectionFilter.includes(sectionId)) return;
      
      const track = this.tracks.get(sectionId);
      if (!track || track.muted || (this.hasSoloedTracks() && !track.soloed)) return;
      
      sectionNotes.forEach(note => {
        const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();
        track.instrument.triggerAttackRelease(
          frequency,
          note.duration,
          note.startTime,
          note.velocity
        );
      });
    });
  }

  async playSequence(notes: MidiNote[], onTimeUpdate?: (time: number) => void, sectionFilter?: SectionType[]) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Stop any currently playing sequence
    this.stop();

    // Update transport BPM
    Tone.Transport.bpm.value = this.playbackOptions.tempo;

    // Group notes by section
    const notesBySection = this.groupNotesBySection(notes);
    
    // Schedule notes for each section
    notesBySection.forEach((sectionNotes, sectionId) => {
      if (sectionFilter && !sectionFilter.includes(sectionId)) return;
      
      const track = this.tracks.get(sectionId);
      if (!track || track.muted || (this.hasSoloedTracks() && !track.soloed)) return;
      
      sectionNotes.forEach(note => {
        const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();
        Tone.Transport.schedule((time) => {
          track.instrument.triggerAttackRelease(
            frequency,
            note.duration,
            time,
            note.velocity
          );
        }, note.startTime);
      });
    });

    // Schedule metronome if enabled
    if (this.playbackOptions.metronome && this.metronome) {
      for (let beat = 0; beat < this.playbackOptions.loopEnd; beat++) {
        const time = beat * (60 / this.playbackOptions.tempo);
        const isAccent = beat % 4 === 0;
        Tone.Transport.schedule((scheduleTime) => {
          this.metronome!.triggerAttackRelease(
            isAccent ? 'C5' : 'C4',
            '16n',
            scheduleTime,
            isAccent ? 0.8 : 0.4
          );
        }, time);
      }
    }

    // Set up time update callback
    if (onTimeUpdate) {
      Tone.Transport.scheduleRepeat((time) => {
        let currentTime = time;
        
        // Handle looping
        if (this.playbackOptions.loop) {
          const loopDuration = (this.playbackOptions.loopEnd - this.playbackOptions.loopStart) * (60 / this.playbackOptions.tempo);
          const loopStartTime = this.playbackOptions.loopStart * (60 / this.playbackOptions.tempo);
          
          if (currentTime >= loopStartTime + loopDuration) {
            currentTime = loopStartTime + ((currentTime - loopStartTime) % loopDuration);
            // Reschedule from loop start
            Tone.Transport.seconds = loopStartTime;
          }
        }
        
        onTimeUpdate(currentTime);
      }, '16n');
    }

    // Set up looping if enabled
    if (this.playbackOptions.loop) {
      const loopDuration = (this.playbackOptions.loopEnd - this.playbackOptions.loopStart) * (60 / this.playbackOptions.tempo);
      const loopStartTime = this.playbackOptions.loopStart * (60 / this.playbackOptions.tempo);
      
      Tone.Transport.setLoopPoints(loopStartTime, loopStartTime + loopDuration);
      Tone.Transport.loop = true;
    }

    // Start playback
    Tone.Transport.start();
  }

  stop() {
    this.stopAllTracks();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.loop = false;
    Tone.Transport.seconds = 0;
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
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Create offline context for rendering
    const offlineContext = new Tone.OfflineContext(2, 10, 44100);
    const offlineMaster = new Tone.Gain(0.8).connect(offlineContext.destination);
    
    // Create offline versions of each track
    const offlineTracks = new Map<SectionType, Tone.PolySynth>();
    const trackConfigs = [
      { id: 'chord' as SectionType, config: { oscillator: { type: 'sine' as const }, envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 1.2 } } },
      { id: 'melody' as SectionType, config: { oscillator: { type: 'sawtooth' as const }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.8 } } },
      { id: 'bass' as SectionType, config: { oscillator: { type: 'triangle' as const }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 } } },
      { id: 'arp' as SectionType, config: { oscillator: { type: 'square' as const }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.3 } } }
    ];
    
    trackConfigs.forEach(({ id, config }) => {
      const track = this.tracks.get(id);
      if (track && !track.muted && (!this.hasSoloedTracks() || track.soloed)) {
        const offlineInstrument = new Tone.PolySynth(Tone.Synth, config).connect(offlineMaster);
        offlineTracks.set(id, offlineInstrument);
      }
    });

    // Schedule notes in offline context
    const notesBySection = this.groupNotesBySection(notes);
    notesBySection.forEach((sectionNotes, sectionId) => {
      const instrument = offlineTracks.get(sectionId);
      if (!instrument) return;
      
      sectionNotes.forEach(note => {
        const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();
        instrument.triggerAttackRelease(
          frequency,
          note.duration,
          note.startTime,
          note.velocity
        );
      });
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

  // New methods for enhanced functionality
  seekTo(time: number) {
    Tone.Transport.seconds = time;
  }

  setTempo(bpm: number) {
    this.playbackOptions.tempo = bpm;
    Tone.Transport.bpm.value = bpm;
  }

  setLoop(enabled: boolean, start?: number, end?: number) {
    this.playbackOptions.loop = enabled;
    if (start !== undefined) this.playbackOptions.loopStart = start;
    if (end !== undefined) this.playbackOptions.loopEnd = end;
    
    if (enabled && start !== undefined && end !== undefined) {
      const loopStartTime = start * (60 / this.playbackOptions.tempo);
      const loopEndTime = end * (60 / this.playbackOptions.tempo);
      Tone.Transport.setLoopPoints(loopStartTime, loopEndTime);
      Tone.Transport.loop = true;
    } else {
      Tone.Transport.loop = false;
    }
  }

  setMetronome(enabled: boolean) {
    this.playbackOptions.metronome = enabled;
  }

  // Track control methods
  setTrackVolume(sectionId: SectionType, volume: number) {
    const track = this.tracks.get(sectionId);
    if (track) {
      track.volume = volume;
      track.gainNode.gain.value = volume / 100;
    }
  }

  setTrackPan(sectionId: SectionType, pan: number) {
    const track = this.tracks.get(sectionId);
    if (track) {
      track.pan = pan;
      track.panNode.pan.value = pan;
    }
  }

  setTrackMute(sectionId: SectionType, muted: boolean) {
    const track = this.tracks.get(sectionId);
    if (track) {
      track.muted = muted;
      track.gainNode.gain.value = muted ? 0 : track.volume / 100;
    }
  }

  setTrackSolo(sectionId: SectionType, soloed: boolean) {
    const track = this.tracks.get(sectionId);
    if (track) {
      track.soloed = soloed;
      this.updateSoloState();
    }
  }

  getTrackConfig(sectionId: SectionType): TrackConfig | undefined {
    return this.tracks.get(sectionId);
  }

  getAllTrackConfigs(): TrackConfig[] {
    return Array.from(this.tracks.values());
  }

  setLevelUpdateCallback(callback: (levels: AudioLevels) => void) {
    this.levelUpdateCallback = callback;
  }

  // Preview methods
  async previewNote(pitch: number, velocity: number = 0.8, sectionId: SectionType = 'melody', duration: number = 0.5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const track = this.tracks.get(sectionId);
    if (!track) return;

    const frequency = Tone.Frequency(pitch, 'midi').toFrequency();
    track.instrument.triggerAttackRelease(frequency, duration, undefined, velocity);
  }

  // Helper methods
  private stopAllTracks() {
    this.tracks.forEach(track => {
      track.instrument.releaseAll();
    });
  }

  private groupNotesBySection(notes: MidiNote[]): Map<SectionType, MidiNote[]> {
    // Use the existing segmentation logic for better section assignment
    const segmented = segmentNotesForPreview(notes);
    const grouped = new Map<SectionType, MidiNote[]>();
    
    grouped.set('chord', segmented.chord);
    grouped.set('melody', segmented.melody);
    grouped.set('bass', segmented.bass);
    grouped.set('arp', segmented.arp);
    
    return grouped;
  }

  private hasSoloedTracks(): boolean {
    return Array.from(this.tracks.values()).some(track => track.soloed);
  }

  private updateSoloState() {
    const hasSolo = this.hasSoloedTracks();
    
    this.tracks.forEach(track => {
      if (hasSolo) {
        // If any track is soloed, only soloed tracks should be audible
        track.gainNode.gain.value = (track.soloed && !track.muted) ? track.volume / 100 : 0;
      } else {
        // If no tracks are soloed, use normal mute/volume settings
        track.gainNode.gain.value = track.muted ? 0 : track.volume / 100;
      }
    });
  }
}
