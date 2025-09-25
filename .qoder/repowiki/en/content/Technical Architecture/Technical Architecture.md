
# Technical Architecture

<cite>
**Referenced Files in This Document**   
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [geminiService.ts](file://src/services/geminiService.ts)
- [audioService.ts](file://src/services/audioService.ts)
- [midiExportService.ts](file://src/services/midiExportService.ts)
- [index.tsx](file://src/pages/index.tsx)
- [Main.tsx](file://src/components/layout/Main.tsx)
- [types/index.ts](file://src/types/index.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
The korysmiditoolbox application is a web-based MIDI composition tool that leverages AI-powered chord progression generation, real-time audio playback, and file export capabilities. Built with React and Next.js, the application integrates Google's Gemini API for AI music generation, Tone.js for Web Audio synthesis, and midi-writer-js for MIDI file creation. The architecture emphasizes client-side state management, secure API key handling, and responsive UI components organized in a hierarchical structure.

## Project Structure

```mermaid
graph TB
subgraph "src"
subgraph "components"
layout["layout/"]
ui["ui/"]
ControlBar["ControlBar.tsx"]
PianoRoll["PianoRoll.tsx"]
SettingsPanel["SettingsPanel.tsx"]
end
subgraph "context"
AppContext["AppContext.tsx"]
end
subgraph "pages"
index["index.tsx"]
end
subgraph "services"
gemini["geminiService.ts"]
audio["audioService.ts"]
midiExport["midiExportService.ts"]
end
subgraph "types"
types["index.ts"]
end
subgraph "utils"
utils["defaultProgression.ts"]
end
end
AppContext --> index
gemini --> index
audio --> index
midiExport --> index
types --> AppContext
types --> services
```

**Diagram sources**
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)
- [index.tsx](file://src/pages/index.tsx#L0-L330)
- [types/index.ts](file://src/types/index.ts#L0-L41)

**Section sources**
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)
- [index.tsx](file://src/pages/index.tsx#L0-L330)

## Core Components

The application's core functionality revolves around three main service classes and a global state management system. The AppContext provides centralized state using React's Context API with a reducer pattern, while specialized services handle AI generation, audio processing, and file export operations. User interactions flow through a hierarchy of React components that consume context state and trigger service methods.

**Section sources**
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)
- [geminiService.ts](file://src/services/geminiService.ts#L0-L70)
- [audioService.ts](file://src/services/audioService.ts#L0-L198)
- [midiExportService.ts](file://src/services/midiExportService.ts#L0-L79)

## Architecture Overview

```mermaid
graph TD
A[User Interface] --> B[AppContext]
B --> C[geminiService]
B --> D[audioService]
B --> E[midiExportService]
C --> F[Google Gemini API]
D --> G[Web Audio API]
E --> H[Browser File API]
B --> I[localStorage]
subgraph "State Management"
B
end
subgraph "Service Layer"
C
D
E
end
subgraph "External APIs"
F
G
H
end
subgraph "Persistence"
I
end
```

**Diagram sources**
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)
- [geminiService.ts](file://src/services/geminiService.ts#L0-L70)
- [audioService.ts](file://src/services/audioService.ts#L0-L198)
- [midiExportService.ts](file://src/services/midiExportService.ts#L0-L79)

## Detailed Component Analysis

### AppContext State Management

```mermaid
classDiagram
class AppContext {
+state : AppState
+dispatch : Dispatch~AppAction~
+addNote(note)
+updateNote(id, updates)
+deleteNote(id)
+selectNote(id)
+clearNotes()
+setRootNote(rootNote)
+setScaleType(scaleType)
+updateSettings(settings)
}
class AppState {
-notes : MidiNote[]
-selectedNoteId : string | null
-isPlaying : boolean
-currentTime : number
-rootNote : RootNote
-scaleType : ScaleType
-settings : AppSettings
}
class AppSettings {
-apiKey : string
-theme : 'light' | 'dark'
-snapToGrid : boolean
-snapToScale : boolean
}
class MidiNote {
-id : string
-pitch : number
-startTime : number
-duration : number
-velocity : number
}
AppContext --> AppState : "contains"
AppContext --> AppSettings : "contains"
AppContext --> MidiNote : "manages"
AppState --> MidiNote : "has many"
AppState --> AppSettings : "has"
```

**Diagram sources**
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)
- [types/index.ts](file://src/types/index.ts#L0-L41)

#### Data Flow Sequence

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "UI Components"
participant Context as "AppContext"
participant Service as "Service Classes"
participant API as "External APIs"
User->>UI : Clicks Generate Button
UI->>Context : Calls handleGenerate()
Context->>Service : Invokes geminiService.generateChordProgression()
Service->>API : Sends request to Google Gemini API
API-->>Service : Returns JSON chord progression
Service-->>Context : Returns parsed MidiNote[] array
Context->>Context : Dispatches CLEAR_NOTES action
Context->>Context : Dispatches ADD_NOTE for each note
Context-->>UI : State update triggers re-render
UI-->>User : Displays new chord progression
```

**Diagram sources**
- [index.tsx](file://src/pages/index.tsx#L61-L104)
- [geminiService.ts](file://src/services/geminiService.ts#L0-L70)
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)

### Service Layer Architecture

```mermaid
graph TD
A[geminiService] --> |Generates| B[MidiNote[]]
C[audioService] --> |Plays| D[Web Audio]
C --> |Exports| E[WAV Blob]
F[midiExportService] --> |Exports| G[MIDI Blob]
B --> C
B --> F
H[AppContext] --> A
H --> C
H --> F
style A fill:#f9f,stroke:#333
style C fill:#f9f,stroke:#333
style F fill:#f9f,stroke:#333
```

**Diagram sources**
- [geminiService.ts](file://src/services/geminiService.ts#L0-L70)
- [audioService.ts](file://src/services/audioService.ts#L0-L198)
- [midiExportService.ts](file://src/services/midiExportService.ts#L0-L79)

#### Service Class Relationships

```mermaid
classDiagram
class GeminiService {
-genAI : GoogleGenerativeAI | null
+constructor(apiKey)
+generateChordProgression(rootNote, scaleType, chordCount)
+updateApiKey(apiKey)
}
class AudioService {
-synth : PolySynth | null
-isInitialized : boolean
+initialize()
+playNotes(notes)
+playSequence(notes, onTimeUpdate)
+stop()
+pause()
+resume()
+getCurrentTime()
+exportWAV(notes)
}
class MidiExportService {
+exportMIDI(notes)
-midiToNoteName(midiNumber)
-durationToMidiWriter(duration)
-timeToTicks(time)
}
class GoogleGenerativeAI {
+getGenerativeModel(config)
}
class Tone {
+start()
+PolySynth
+Transport
+OfflineContext
}
class MidiWriter {
+Track
+NoteEvent
+Writer
}
GeminiService --> GoogleGenerativeAI : "uses"
AudioService --> Tone : "uses"
MidiExportService --> MidiWriter : "uses"
```

**Diagram sources**
- [geminiService.ts](file://src/services/geminiService.ts#L0-L70)
- [audioService.ts](file://src/services/audioService.ts#L0-L198)
- [midiExportService.ts](file://src/services/midiExportService.ts#L0-L79)

## Dependency Analysis

```mermaid
graph LR
A[index.tsx] --> B[AppProvider]
A --> C[ToastProvider]
A --> D[geminiService]
A --> E[audioService]
A --> F[midiExportService]
B --> G[AppContext]
G --> H[useReducer]
G --> I[localStorage]
D --> J[GoogleGenerativeAI]
E --> K[Tone.js]
F --> L[midi-writer-js]
A --> M[Header]
A --> N[Main]
A --> O[Footer]
M --> P[Button]
N --> Q[ControlPanel]
N --> R[PianoRollPreview]
style A fill:#ffcccc,stroke:#333
style G fill:#ccffcc,stroke:#333
style D fill:#ccccff,stroke:#333
style E fill:#ccccff,stroke:#333
style F fill:#ccccff,stroke:#333
```

**Diagram sources**
- [index.tsx](file://src/pages/index.tsx#L0-L330)
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)
- [services/*.ts](file://src/services/)

**Section sources**
- [index.tsx](file://src/pages/index.tsx#L0-L330)
- [AppContext.tsx](file://src/context/AppContext.tsx#L0-L220)

## Performance Considerations

The application implements several performance optimizations including canvas-based rendering for the piano roll component, efficient state updates through React's useReducer hook, and lazy