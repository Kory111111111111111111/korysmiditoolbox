# Playback Controls

<cite>
**Referenced Files in This Document **  
- [Footer.tsx](file://src/components/layout/Footer.tsx)
- [index.tsx](file://src/pages/index.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [audioService.ts](file://src/services/audioService.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Playback Control Mechanism](#playback-control-mechanism)
3. [Animation Frame Loop and Time Calculation](#animation-frame-loop-and-time-calculation)
4. [Visual Feedback via Playhead Rendering](#visual-feedback-via-playhead-rendering)
5. [Volume Control and Audio Integration](#volume-control-and-audio-integration)
6. [Synchronization Challenges and Web Audio API Improvements](#synchronization-challenges-and-web-audio-api-improvements)

## Introduction
This document details the implementation of the audio playback system within the MIDI toolbox application. It covers how play, pause, and stop controls dispatch state changes, how time is updated using `requestAnimationFrame`, how visual feedback is rendered during playback, and how volume control integrates with the underlying audio engine. The system relies on React context for state management and Tone.js for actual audio synthesis.

## Playback Control Mechanism

The transport controls—Play, Pause, and Stop—are implemented in the `Footer` component and interact directly with the global application state through Redux-style dispatch actions. When a user interacts with these buttons, corresponding handler functions are triggered that dispatch either `SET_PLAYING` or `SET_CURRENT_TIME` actions to update the playback state.

The `Footer` component receives `isPlaying`, `onPlay`, `onPause`, and `onStop` as props, which are bound to UI elements. The Play/Pause button toggles its appearance and behavior based on the current `isPlaying` state, while the Stop button resets both the playing flag and the current time.

These handlers are defined in `index.tsx` and passed down to `Footer`. They manipulate the central state managed by `AppContext`.

**Section sources**
- [Footer.tsx](file://src/components/layout/Footer.tsx#L0-L163)
- [index.tsx](file://src/pages/index.tsx#L102-L147)

## Animation Frame Loop and Time Calculation

In `index.tsx`, an `useEffect` hook manages a continuous animation frame loop using `requestAnimationFrame`. This loop runs only when `state.isPlaying` is true and updates the `currentTime` in the global state at each frame.

The timing logic calculates delta time between frames:
- Captures the timestamp from `requestAnimationFrame`
- Computes `deltaMs` since the last frame
- Converts it to seconds (`deltaSec`)
- Increments `state.currentTime` accordingly

A key calculation aligns the visual timeline with musical tempo:
```ts
const secondsPerBeat = 60 / bpm;
```
Although this value is declared, it's not directly used in the increment; instead, raw elapsed time is added. This means the visual playhead progresses independently of BPM unless explicitly scaled.

The effect includes proper cleanup: canceling the animation frame on unmount or when playback stops, ensuring no memory leaks or ghost updates.

**Code Snippet Path**: [Animation frame loop with delta time and cleanup](file://src/pages/index.tsx#L144-L185)

**Section sources**
- [index.tsx](file://src/pages/index.tsx#L144-L185)

## Visual Feedback via Playhead Rendering

When playback is active (`state.isPlaying === true`), the `PianoRoll` component renders a vertical playhead line that moves across the timeline according to `state.currentTime`.

Inside the `draw` function of `PianoRoll.tsx`, the playhead position is calculated as:
```ts
const playheadX = state.currentTime * (beatWidth / 2);
```
This maps the current time (in seconds) to pixel coordinates on the canvas, assuming a fixed conversion rate where half-beats correspond to `beatWidth` pixels.

The playhead is drawn as a red vertical line (`#f43f5e`) spanning the height of the piano roll, providing real-time visual feedback synchronized with the internal clock maintained by the animation loop.

No direct synchronization exists between this visual timer and actual audio output—this is purely a UI representation driven by the same `currentTime` state.

**Section sources**
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx#L183-L226)

## Volume Control and Audio Integration

The `Footer` component includes a volume slider that binds to a local `volume` state variable. The input range element calls `onVolumeChange` whenever the user adjusts the slider, updating the volume level displayed numerically beside the control.

Currently, this volume control is **not connected** to any audio output mechanism in terms of real-time adjustment. However, the application has a fully implemented `AudioService` class in `audioService.ts` that uses Tone.js to generate sound.

The `AudioService` provides methods like:
- `playSequence(notes, onTimeUpdate)` – schedules notes via Tone.Transport
- `stop()`, `pause()`, `resume()` – controls playback
- `exportWAV()` – renders audio offline for export

Notably, the `playSequence` method accepts an optional `onTimeUpdate` callback, which could be used to synchronize the visual `currentTime` with the precise Web Audio clock (`Tone.Transport.seconds`). This integration point is currently underutilized, as the visual timer runs independently via `requestAnimationFrame`.

Potential integration would involve:
- Using `Tone.start()` to initialize the audio context
- Replacing the manual `requestAnimationFrame` loop with `Tone.Transport.scheduleRepeat`
- Binding `onTimeUpdate` to dispatch `SET_CURRENT_TIME` with accurate audio timeline values

**Section sources**
- [Footer.tsx](file://src/components/layout/Footer.tsx#L47-L71)
- [audioService.ts](file://src/services/audioService.ts#L0-L198)

## Synchronization Challenges and Web Audio API Improvements

### Current Synchronization Issues
The primary challenge lies in **desynchronization** between the visual playhead and actual audio playback:
- Visual timing uses `requestAnimationFrame`, which is tied to screen refresh rates (~60Hz) and can drift
- Audio timing via `Tone.Transport` uses high-precision Web Audio API clocks (sub-millisecond accuracy)
- Independent time sources lead to increasing lag over long sessions

Additionally, starting audio requires user interaction due to browser autoplay policies, but the current UI does not ensure Tone.js initialization before playback begins.

### Recommended Improvements Using Web Audio API
To achieve tight synchronization:

#### 1. Use Tone.Transport as Master Clock
Replace the `useEffect` animation loop with `Tone.Transport.scheduleRepeat`:
```ts
Tone.Transport.scheduleRepeat((time) => {
  dispatch({ type: 'SET_CURRENT_TIME', payload: Tone.Transport.seconds });
}, 0.05); // Update every 50ms
```

#### 2. Sync Start/Stop with Transport
Instead of just setting `isPlaying`, coordinate with `Tone.Transport`:
```ts
const handlePlay = () => {
  audioService.current?.resume();
  dispatch({ type: 'SET_PLAYING', payload: true });
};
```

#### 3. Initialize Audio Context on First Interaction
Ensure `Tone.start()` is called early, possibly on first play attempt, to unlock audio.

#### 4. Derive Playhead Position from Audio Clock
Remove reliance on `state.currentTime` derived from `raf` and use `Tone.Transport.seconds` directly in `PianoRoll` when playing.

These changes would unify the timing source, eliminate drift, and provide professional-grade sync suitable for music production workflows.

**Section sources**
- [index.tsx](file://src/pages/index.tsx#L144-L185)
- [audioService.ts](file://src/services/audioService.ts#L48-L110)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx#L183-L226)