# API Reference

<cite>
**Referenced Files in This Document**   
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [geminiService.ts](file://src/services/geminiService.ts)
- [audioService.ts](file://src/services/audioService.ts)
- [midiExportService.ts](file://src/services/midiExportService.ts)
- [index.ts](file://src/types/index.ts)
</cite>

## Table of Contents
1. [AppContext and useApp Hook](#appcontext-and-useapp-hook)
2. [geminiService](#geminiservice)
3. [audioService](#audioservice)
4. [midiExportService](#midiexportservice)

## AppContext and useApp Hook

The `AppContext` provides global state management for the application using React's Context API and `useReducer`. It maintains the application's core state including MIDI notes, playback status, root note, scale type, and user settings.

### AppState Shape

The `AppState` interface defines the structure of the application state:

```typescript
interface AppState {
  notes: MidiNote[];
  selectedNoteId: string | null;
  isPlaying: boolean;
  currentTime: number;
  rootNote: string;
  scaleType: string;
  settings: AppSettings;
}
```

The context persists state to `localStorage` under the keys `korysmiditoolbox-state` (for notes, root note, and scale) and `korysmiditoolbox-settings` (for user preferences).

### Dispatch Actions

The following action types are supported by the reducer:

- **ADD_NOTE**: Adds a new MIDI note to the sequence
- **UPDATE_NOTE**: Updates properties of an existing note by ID
- **DELETE_NOTE**: Removes a note by ID and clears selection if applicable
- **SELECT_NOTE**: Sets the currently selected note ID
- **CLEAR_NOTES**: Removes all notes and resets selection
- **SET_ROOT_NOTE**: Changes the root note for chord generation
- **SET_SCALE_TYPE**: Changes the scale type for chord generation
- **SET_PLAYING**: Toggles playback state
- **SET_CURRENT_TIME**: Updates the current playback position in seconds
- **UPDATE_SETTINGS**: Merges partial settings updates
- **LOAD_STATE**: Loads a partial state object (used during initialization)

### Context Methods

The context exposes several convenience methods that wrap dispatch actions:

- `addNote(note: Omit<MidiNote, 'id'>)`: Creates a new note with a generated ID and adds it to the sequence
- `updateNote(id: string, updates: Partial<MidiNote>)`: Updates specific properties of an existing note
- `deleteNote(id: string)`: Removes a note by ID
- `selectNote(id: string | null)`: Sets the selected note ID
- `clearNotes()`: Removes all notes from the sequence
- `setRootNote(rootNote: RootNote)`: Updates the root note
- `setScaleType(scaleType: ScaleType)`: Updates the scale type
- `updateSettings(settings: Partial<AppSettings>)`: Updates user settings

### useApp Hook Usage

The `useApp()` hook provides access to the context value. It throws an error if used outside of an `AppProvider`.

```tsx
const { state, dispatch, addNote, updateNote } = useApp();
```

Components should typically destructure only the methods they need to avoid unnecessary re-renders.

**Section sources**
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)

## geminiService

The `GeminiService` class integrates with Google's Generative AI API to generate chord progressions based on musical parameters.

### generateChords Method

#### Parameters

| Parameter | Type | Required | Description |
|---------|------|----------|-------------|
| `rootNote` | RootNote | Yes | The root note of the key (e.g., 'C', 'G#') |
| `scaleType` | ScaleType | Yes | The scale/mode type ('Major', 'Minor', etc.) |
| `chordCount` | number | No | Number of chords in progression (default: 4) |

Where:
- `RootNote` = 'C' \| 'C#' \| 'D' \| 'D#' \| 'E' \| 'F' \| 'F#' \| 'G' \| 'G#' \| 'A' \| 'A#' \| 'B'
- `ScaleType` = 'Major' \| 'Minor' \| 'Dorian' \| 'Phrygian' \| 'Lydian' \| 'Mixolydian' \| 'Harmonic Minor'

#### Return Type

Returns a `Promise<MidiNote[]>` containing generated notes structured as:

```typescript
interface MidiNote {
  id: string;
  pitch: number; // MIDI note number (0-127)
  startTime: number; // in seconds
  duration: number; // in seconds
  velocity: number; // 0-1
}
```

Each chord spans 2 seconds with notes in the 3rd-5th octave range (MIDI 36-84), typically including root, third, fifth, and optionally seventh.

#### Error Handling

The method implements comprehensive error handling:

- Throws `'API key not provided'` if no valid API key was supplied to the constructor
- Catches and logs generation errors, re-throwing as user-friendly messages
- Validates JSON response format and parses only the array portion
- Sanitizes output values (pitch clamped 0-127, velocity clamped 0-1)

#### HTTP Request Implementation

Uses the official Google Generative AI SDK (`@google/generative-ai`) to communicate with the Gemini Pro model:

```typescript
const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent(prompt);
```

The service constructs a detailed prompt requesting JSON-formatted chord data, then extracts and validates the response.

#### Rate Limiting Considerations

While the client-side implementation doesn't handle rate limiting directly, users should be aware that:

- Google's API has usage quotas and rate limits
- Excessive generation requests may trigger quota exceeded errors
- The application stores API keys in localStorage but makes direct browser-to-API calls
- No retry logic is implemented for rate-limited requests

**Section sources**
- [geminiService.ts](file://src/services/geminiService.ts#L0-L70)
- [index.ts](file://src/types/index.ts#L30-L41)

## audioService

The `AudioService` class manages audio playback, visualization, and export using the Tone.js library.

### Core Methods

#### play()

Initializes the audio context and plays a sequence of notes using Tone.Transport for precise timing:

```typescript
async playSequence(notes: MidiNote[], onTimeUpdate?: (time: number) => void)
```

Schedules each note with `triggerAttackRelease()` at its specified start time. Accepts an optional callback for UI synchronization.

#### stop()

Stops all playback and resets the transport:

```typescript
stop()
```

Calls both `synth.releaseAll()` and `Tone.Transport.stop()` with `cancel()` to clear scheduled events.

#### exportWav()

Performs offline rendering to generate downloadable WAV files:

```typescript
async exportWAV(notes: MidiNote[]): Promise<Blob>
```

Uses `Tone.OfflineContext` to render audio without real-time constraints, then converts the buffer to WAV format with proper headers.

### Tone.js Transport Integration

The service leverages Tone.js Transport for synchronized playback:

- Uses a global Transport instance for timeline coordination
- Schedules notes with `Transport.schedule()` at their startTime
- Provides `getCurrentTime()` to query transport position
- Implements pause/resume functionality via `Transport.pause()` and `start()`

### Offline Rendering Process

The WAV export process involves:

1. Creating an `OfflineContext` with 2 channels, 10-second duration, 44.1kHz sample rate
2. Setting up a matching synthesizer connected to the offline destination
3. Scheduling all notes using the same `triggerAttackRelease` pattern
4. Calling `render()` to process the entire timeline
5. Converting the resulting `AudioBuffer` to WAV format with proper headers
6. Returning a Blob with MIME type 'audio/wav'

### Performance Implications

Audio rendering operations have significant performance considerations:

- Real-time playback requires Web Audio context activation (user gesture)
- Offline rendering is CPU-intensive and blocks the main thread during processing
- Large sequences increase memory usage and rendering time
- The initial `Tone.start()` call can take several hundred milliseconds
- Repeated initialization should be avoided through service reuse

**Section sources**
- [audioService.ts](file://src/services/audioService.ts#L0-L198)

## midiExportService

The `MidiExportService` class generates standard MIDI files from the application's note data.

### generateMidiFile() Parameters

The primary method `exportMIDI(notes: MidiNote[]): Blob` accepts:

- `notes`: Array of `MidiNote` objects to include in the MIDI file

The method processes these notes by:
- Sorting by startTime
- Grouping simultaneous notes into chords
- Converting MIDI numbers to note names (e.g., 60 → "C4")
- Calculating appropriate MIDI durations and velocities

### Binary Blob Output

Returns a `Blob` with MIME type 'audio/midi' containing a standard MIDI file. The blob can be used to create download URLs:

```javascript
const url = URL.createObjectURL(midiBlob);
// ... create download link
URL.revokeObjectURL(url);
```

The service uses `midi-writer-js` to construct the MIDI file with proper headers, track data, and timing information based on 120 BPM and 480 ticks per quarter note.

**Section sources**
- [midiExportService.ts](file://src/services/midiExportService.ts#L0-L79)