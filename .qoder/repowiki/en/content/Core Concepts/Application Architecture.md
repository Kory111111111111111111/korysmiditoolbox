# Application Architecture

<cite>
**Referenced Files in This Document**
- [index.tsx](file://src/pages/index.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [ControlBar.tsx](file://src/components/ControlBar.tsx)
- [geminiService.ts](file://src/services/geminiService.ts)
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
This document provides a comprehensive architectural overview of korysmiditoolbox's frontend application, focusing on its React component hierarchy, state management system, and data flow patterns. The application enables users to create, edit, and export MIDI-based chord progressions with AI assistance through Google's Gemini API. Central to the architecture is the AppContext system that manages application state, user settings, and playback controls.

## Project Structure

```mermaid
graph TD
A[src] --> B[components]
A --> C[context]
A --> D[pages]
A --> E[services]
A --> F[types]
A --> G[utils]
B --> H[layout]
B --> I[ui]
B --> J[PianoRoll.tsx]
B --> K[ControlBar.tsx]
B --> L[SettingsPanel.tsx]
H --> M[Header.tsx]
H --> N[Main.tsx]
H --> O[Footer.tsx]
H --> P[ControlPanel.tsx]
C --> Q[AppContext.tsx]
D --> R[index.tsx]
E --> S[geminiService.ts]
E --> T[audioService.ts]
E --> U[midiExportService.ts]
F --> V[index.ts]
```

**Diagram sources**
- [src/pages/index.tsx](file://src/pages/index.tsx)
- [src/components/layout/Header.tsx](file://src/components/layout/Header.tsx)
- [src/components/layout/Main.tsx](file://src/components/layout/Main.tsx)
- [src/components/layout/Footer.tsx](file://src/components/layout/Footer.tsx)
- [src/components/ControlBar.tsx](file://src/components/ControlBar.tsx)
- [src/components/PianoRoll.tsx](file://src/components/PianoRoll.tsx)

**Section sources**
- [src/pages/index.tsx](file://src/pages/index.tsx)
- [src/components/layout/Header.tsx](file://src/components/layout/Header.tsx)
- [src/components/layout/Main.tsx](file://src/components/layout/Main.tsx)
- [src/components/layout/Footer.tsx](file://src/components/layout/Footer.tsx)

## Core Components

The application's core components form a hierarchical structure starting from the root index.tsx file, progressing through layout components, and culminating in interactive elements like PianoRoll and ControlBar. The AppContext serves as the central hub for state management, providing global access to notes, playback state, and user preferences across all components.

**Section sources**
- [index.tsx](file://src/pages/index.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [ControlBar.tsx](file://src/components/ControlBar.tsx)

## Architecture Overview

```mermaid
graph TD
A[index.tsx] --> B[AppProvider]
B --> C[ToastProvider]
C --> D[MainApp]
D --> E[Header]
D --> F[Main]
D --> G[Footer]
D --> H[PianoRoll Modal]
D --> I[SettingsPanel]
F --> J[ControlPanel]
J --> K[ControlBar]
K --> L[useApp Hook]
H --> M[PianoRoll]
M --> L
L --> N[AppContext]
N --> O[AppState]
O --> P[Notes]
O --> Q[Playback State]
O --> R[User Settings]
S[geminiService] --> L
T[audioService] --> L
U[midiExportService] --> L
```

**Diagram sources**
- [index.tsx](file://src/pages/index.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [ControlBar.tsx](file://src/components/ControlBar.tsx)
- [services/geminiService.ts](file://src/services/geminiService.ts)

## Detailed Component Analysis

### Component Hierarchy Analysis

#### Main Application Structure:
```mermaid
classDiagram
class MainApp {
+state : AppState
+dispatch : Dispatch~AppAction~
+handleGenerate() : Promise~void~
+handleExportMIDI() : void
+handleExportWAV() : void
+handlePlay() : void
+handlePause() : void
+handleStop() : void
}
class Header {
+onExportMIDI : () => void
+onExportWAV : () => void
}
class Main {
+notesCount : number
+onOpenPianoRoll : () => void
}
class Footer {
+isPlaying : boolean
+onPlay : () => void
+onPause : () => void
+onStop : () => void
+volume : number
+onVolumeChange : (v : number) => void
+bpm : number
+onBpmChange : (b : number) => void
+keySignature : string
}
MainApp --> Header : "renders"
MainApp --> Main : "renders"
MainApp --> Footer : "renders"
Main --> ControlPanel : "contains"
ControlPanel --> ControlBar : "contains"
```

**Diagram sources**
- [index.tsx](file://src/pages/index.tsx)

**Section sources**
- [index.tsx](file://src/pages/index.tsx)

### AppState Interface and Context Management

The AppState interface defines the complete state structure for the application, centralizing all critical data in a single location accessible throughout the component tree via the AppContext.

```mermaid
classDiagram
class AppState {
+notes : MidiNote[]
+selectedNoteId : string | null
+isPlaying : boolean
+currentTime : number
+rootNote : string
+scaleType : string
+settings : AppSettings
}
class AppSettings {
+apiKey : string
+theme : 'light' | 'dark'
+snapToGrid? : boolean
+snapToScale? : boolean
}
class MidiNote {
+id : string
+pitch : number
+startTime : number
+duration : number
+velocity : number
}
class AppContextType {
+state : AppState
+dispatch : Dispatch~AppAction~
+addNote(note : Omit~MidiNote, 'id'~) : void
+updateNote(id : string, updates : Partial~MidiNote~) : void
+deleteNote(id : string) : void
+selectNote(id : string | null) : void
+clearNotes() : void
+setRootNote(rootNote : RootNote) : void
+setScaleType(scaleType : ScaleType) : void
+updateSettings(settings : Partial~AppSettings~) : void
}
AppState "1" *-- "1" AppSettings
AppState "1" *-- "*" MidiNote
AppContextType "1" -- "1" AppState
```

**Diagram sources**
- [types/index.ts](file://src/types/index.ts)
- [AppContext.tsx](file://src/context/AppContext.tsx)

**Section sources**
- [types/index.ts](file://src/types/index.ts)
- [AppContext.tsx](file://src/context/AppContext.tsx)

### Data Flow Analysis

#### User Interaction Flow:
```mermaid
sequenceDiagram
participant User
participant ControlBar
participant AppContext
participant geminiService
participant MainApp
User->>ControlBar : Click Generate Button
ControlBar->>MainApp : Call handleGenerate()
MainApp->>AppContext : Validate API Key
alt API Key Valid
MainApp->>geminiService : generateChordProgression()
geminiService-->>MainApp : Return new notes array
MainApp->>AppContext : dispatch(ADD_NOTE) for each note
AppContext-->>MainApp : Updated state
MainApp->>User : Show success toast
else API Key Invalid
MainApp->>User : Show error toast
end
```

**Diagram sources**
- [index.tsx](file://src/pages/index.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [services/geminiService.ts](file://src/services/geminiService.ts)

#### Playback Control Flow:
```mermaid
sequenceDiagram
participant User
participant Footer
participant AppContext
participant MainApp
User->>Footer : Click Play Button
Footer->>MainApp : Call handlePlay()
MainApp->>AppContext : dispatch(SET_PLAYING, true)
AppContext-->>MainApp : Updated state
MainApp->>MainApp : Start animation frame loop
loop Every frame
MainApp->>AppContext : dispatch(SET_CURRENT_TIME)
AppContext-->>PianoRoll : Updated currentTime
PianoRoll->>Canvas : Render playhead at new position
end
User->>Footer : Click Pause Button
Footer->>MainApp : Call handlePause()
MainApp->>AppContext : dispatch(SET_PLAYING, false)
AppContext-->>MainApp : Updated state
MainApp->>MainApp : Cancel animation frame loop
```

**Diagram sources**
- [index.tsx](file://src/pages/index.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)

### TypeScript Type Safety Implementation

The application leverages TypeScript interfaces to enforce type safety across components and services, ensuring consistent data structures and reducing runtime errors.

```mermaid
classDiagram
class RootNote {
<<type>>
C
C#
D
D#
E
F
F#
G
G#
A
A#
B
}
class ScaleType {
<<type>>
Major
Minor
Dorian
Phrygian
Lydian
Mixolydian
Harmonic Minor
}
class AppAction {
<<union>>
ADD_NOTE
UPDATE_NOTE
DELETE_NOTE
SELECT_NOTE
CLEAR_NOTES
SET_ROOT_NOTE
SET_SCALE_TYPE
SET_PLAYING
SET_CURRENT_TIME
UPDATE_SETTINGS
LOAD_STATE
}
class PianoRollDimensions {
+width : number
+height : number
+noteHeight : number
+beatWidth : number
}
AppContext --> AppAction : "uses for dispatch"
ControlBar --> RootNote : "uses for selection"
ControlBar --> ScaleType : "uses for selection"
PianoRoll --> PianoRollDimensions : "uses for rendering"
AppState --> MidiNote : "contains array of"
```

**Diagram sources**
- [types/index.ts](file://src/types/index.ts)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [ControlBar.tsx](file://src/components/ControlBar.tsx)

**Section sources**
- [types/index.ts](file://src/types/index.ts)

### AI Chord Progression Generation Lifecycle

The sequence diagram below illustrates the complete lifecycle of an AI-generated chord progression, from the initial API call to state update and visual rendering.

```mermaid
sequenceDiagram
participant User
participant MainApp
participant geminiService
participant AppContext
participant PianoRoll
User->>MainApp : Click Generate Button
MainApp->>MainApp : Validate API Key exists
alt API Key Present
MainApp->>geminiService : generateChordProgression(rootNote, scaleType, 4)
geminiService->>GoogleGenerativeAI : generateContent(prompt)
GoogleGenerativeAI-->>geminiService : Response with JSON text
geminiService->>geminiService : Extract JSON array using regex
geminiService->>geminiService : Parse and validate notes
geminiService->>geminiService : Add IDs and clamp values
geminiService-->>MainApp : Return validated MidiNote[] array
MainApp->>AppContext : clearNotes() then add each new note
AppContext-->>MainApp : State updated with new notes
MainApp->>User : Show success toast
AppContext->>PianoRoll : Notes array changed
PianoRoll->>Canvas : Redraw with new notes
else API Key Missing
MainApp->>User : Show error toast
end
```

**Diagram sources**
- [index.tsx](file://src/pages/index.tsx)
- [services/geminiService.ts](file://src/services/geminiService.ts)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)

**Section sources**
- [index.tsx](file://src/pages/index.tsx)
- [services/geminiService.ts](file://src/services/geminiService.ts)

## Dependency Analysis

```mermaid
graph TD
A[index.tsx] --> B[AppContext.tsx]
A --> C[PianoRoll.tsx]
A --> D[ControlBar.tsx]
A --> E[geminiService.ts]
A --> F[audioService.ts]
A --> G[midiExportService.ts]
B --> H[types/index.ts]
C --> B
C --> H
C --> I[midiUtils.ts]
D --> B
D --> H
E --> H
F --> H
G --> H
I --> H
```

**Diagram sources**
- [index.tsx](file://src/pages/index.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [ControlBar.tsx](file://src/components/ControlBar.tsx)
- [services/geminiService.ts](file://src/services/geminiService.ts)
- [types/index.ts](file://src/types/index.ts)

**Section sources**
- [index.tsx](file://src/pages/index.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [ControlBar.tsx](file://src/components/ControlBar.tsx)
- [services/geminiService.ts](file://src/services/geminiService.ts)
- [types/index.ts](file://src/types/index.ts)

## Performance Considerations
The application implements several performance optimizations including requestAnimationFrame for smooth playback visualization, useCallback for memoizing event handlers in the PianoRoll component, and useEffect dependency arrays to prevent unnecessary re-renders. The use of refs for service instances prevents recreation on every render, while localStorage persistence reduces initialization time by restoring previous state.

## Troubleshooting Guide
Common issues include failed AI generation due to missing or invalid API keys, which is handled with appropriate error messaging. MIDI/WAV export failures may occur if the browser blocks automatic downloads, requiring user interaction. Note editing issues can arise from incorrect snapping behavior, which can be toggled via the settings panel. Performance degradation may occur with very large note collections, though the current implementation is optimized for typical chord progression sizes.

## Conclusion
korysmiditoolbox employs a well-structured React architecture with Context API for state management, which is appropriate for its medium complexity level. The separation of concerns between UI components, context providers, and service classes creates a maintainable codebase. TypeScript interfaces provide robust type safety, while the modular service architecture allows for easy extension. The Context API proves effective for this application size, avoiding the complexity of external state management libraries while providing sufficient scalability and performance.