# Feature-Specific Guides

<cite>
**Referenced Files in This Document**   
- [geminiService.ts](file://src/services/geminiService.ts)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [audioService.ts](file://src/services/audioService.ts)
- [midiExportService.ts](file://src/services/midiExportService.ts)
- [midiUtils.ts](file://src/utils/midiUtils.ts)
- [AppContext.tsx](file://src/context/AppContext.tsx)
</cite>

## Table of Contents
1. [AI Chord Generation](#ai-chord-generation)
2. [Piano Roll Editor](#piano-roll-editor)
3. [Audio Playback](#audio-playback)
4. [Export Functionality](#export-functionality)
5. [Scale Snapping](#scale-snapping)

## AI Chord Generation

The AI Chord Generation feature leverages Google's Gemini API to generate musically coherent chord progressions based on user-defined parameters such as root note and scale type. The integration is implemented through the `GeminiService` class, which handles API communication, prompt engineering, response parsing, and validation.

When a user requests chord generation, the service constructs a detailed natural language prompt specifying the desired chord count, root note, scale type, timing structure (each chord lasting 2 seconds), and formatting requirements (JSON output with specific MIDI properties). The prompt instructs Gemini to create realistic chord voicings using common progressions within the specified key, including appropriate chord tones (root, third, fifth, seventh) in the 3rd-5th octave range (MIDI 36-84).

Upon receiving the API response, the system extracts the JSON array from the text using regex pattern matching (`/\[[\s\S]*\]/`). The parsed notes undergo rigorous validation to ensure all required fields (pitch, startTime, duration, velocity) are present and within valid ranges (pitch: 0-127, velocity: 0-1). Invalid values are clamped or assigned defaults. Each note is assigned a unique ID before being returned to the application state.

This implementation ensures robust error handling, with meaningful error messages presented to users when API keys are missing or responses cannot be parsed. The service also supports dynamic API key updates through the `updateApiKey` method, allowing users to configure their credentials through the application settings.

**Section sources**
- [geminiService.ts](file://src/services/geminiService.ts#L1-L70)

## Piano Roll Editor

The Piano Roll Editor provides a canvas-based interface for visual music composition, enabling users to create, edit, and manipulate MIDI notes through direct interaction. The implementation in `PianoRoll.tsx` uses HTML5 Canvas for efficient rendering of the grid, piano keyboard, and musical notes.

The editor supports multiple interaction modes through mouse events: double-clicking adds new notes, clicking selects existing notes, dragging moves notes (with pitch and time snapping), and resizing adjusts note duration by dragging the start or end edges. Keyboard shortcuts include Delete/Backspace for removing selected notes. Visual feedback mechanisms enhance usability, including color-coded selection states (blue for selected, green for unselected), hover effects on piano keys, and a subtle animation pulse when adding new notes.

The canvas rendering process draws a comprehensive grid with bar lines (thicker), beat lines, and horizontal lines for each semitone. Notes are rendered with gradient fills, rounded corners, and glow effects for visual distinction. A playhead indicator (red vertical line) moves during playback to show the current position. The piano keyboard sidebar displays note names (C4-C6 range) with appropriate black/white key styling.

**Section sources**
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx#L0-L439)

## Audio Playback

Audio playback functionality is managed by the `AudioService` class, which integrates with Tone.js for professional-grade audio synthesis and scheduling. The service initializes a polyphonic synthesizer with a sawtooth oscillator and ADSR envelope (attack: 0.1s, decay: 0.2s, sustain: 0.5, release: 0.8s) for rich harmonic content.

The playhead visualization is synchronized with Tone.js's Transport system, which provides precise timing for musical sequences. When playback starts, the service schedules all notes using `Tone.Transport.schedule()`, triggering attack-release envelopes at their designated start times. A repeating callback (`scheduleRepeat` at 16th-note intervals) updates the application state with the current playback time, which drives the moving playhead in the piano roll.

The service implements standard transport controls: play (starts Transport), pause (pauses Transport), resume (restarts Transport), and stop (stops Transport and releases all notes). The `getCurrentTime()` method returns the Transport's current position in seconds. These controls are integrated with the application's state management system, updating the `isPlaying` and `currentTime` values in the AppContext.

**Section sources**
- [audioService.ts](file://src/services/audioService.ts#L0-L199)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx#L150-L170)

## Export Functionality

The export system provides two formats: MIDI and WAV, each implemented with specialized processing to ensure proper musical timing and structure.

MIDI export is handled by the `MidiExportService` class using the midi-writer-js library. The implementation groups notes by their start time (rounded to milliseconds) to reconstruct chords, ensuring that simultaneous notes are properly represented in the MIDI file. Each group is converted to a MIDI track event with appropriate note names (e.g., "C4"), durations mapped to standard notation values (quarter, half, etc.), and velocities scaled to MIDI's 0-127 range. Timing is calculated using ticks (480 per quarter note at 120 BPM), ensuring accurate temporal representation.

WAV export utilizes Tone.js's offline rendering capabilities through the `OfflineContext`. The service creates a separate synthesis environment where all notes are scheduled and rendered to an audio buffer. This buffer is then converted to WAV format using a manual header construction process that includes proper RIFF/WAVE formatting, sample rate metadata (44.1kHz), and 16-bit PCM encoding. The resulting Blob is made available for download with a timestamped filename.

Both export methods integrate with the UI through dedicated handlers that trigger downloads via temporary object URLs.

**Section sources**
- [midiExportService.ts](file://src/services/midiExportService.ts#L0-L80)
- [audioService.ts](file://src/services/audioService.ts#L150-L199)

## Scale Snapping

Scale snapping is implemented algorithmically within the Piano Roll component to constrain note placement to valid scale degrees. The system uses the current root note and scale type (stored in AppContext) to determine allowed pitch classes.

The core algorithm in `allowedPitchClasses()` calculates the pitch class set for the selected scale by combining the root note's pitch class with predefined interval patterns (e.g., Major: [0,2,4,5,7,9,11]). When a user interacts with the piano roll, the `snapPitchToScale()` function finds the nearest scale tone to the target pitch, searching outward up to a tritone in both directions. For directional movements (dragging), `snapPitchToScaleDirectional()` searches only in the direction of movement for more intuitive behavior.

Scale snapping can be toggled via application settings (`snapToScale` flag) and temporarily overridden with the Alt key for chromatic input. The snapping applies during note creation (double-click) and modification (dragging), ensuring musical consistency while preserving user control. Time quantization is handled separately but works in conjunction with scale snapping to provide comprehensive musical alignment.

**Section sources**
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx#L200-L240)
- [midiUtils.ts](file://src/utils/midiUtils.ts#L100-L130)
- [AppContext.tsx](file://src/context/AppContext.tsx#L50-L60)