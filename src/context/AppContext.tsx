import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, MidiNote, AppSettings, RootNote, ScaleType, SectionType, AudioSectionType, AudioTrackState } from '@/types';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useKeyboardShortcuts, commonShortcuts, platformShortcut } from '@/hooks/useKeyboardShortcuts';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addNote: (note: Omit<MidiNote, 'id'>) => void;
  updateNote: (id: string, updates: Partial<MidiNote>) => void;
  deleteNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  clearNotes: () => void;
  setRootNote: (rootNote: RootNote) => void;
  setScaleType: (scaleType: ScaleType) => void;
  setEditingSection: (section: SectionType) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  // Audio control methods
  setTrackVolume: (sectionId: AudioSectionType, volume: number) => void;
  setTrackPan: (sectionId: AudioSectionType, pan: number) => void;
  setTrackMute: (sectionId: AudioSectionType, muted: boolean) => void;
  setTrackSolo: (sectionId: AudioSectionType, soloed: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setTempo: (tempo: number) => void;
  setMetronome: (enabled: boolean) => void;
  setLoop: (enabled: boolean, start?: number, end?: number) => void;
  updateAudioLevels: (levels: { [key: string]: number }) => void;
  // Undo/Redo functionality
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

type AppAction =
  | { type: 'ADD_NOTE'; payload: MidiNote }
  | { type: 'UPDATE_NOTE'; payload: { id: string; updates: Partial<MidiNote> } }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SELECT_NOTE'; payload: string | null }
  | { type: 'CLEAR_NOTES' }
  | { type: 'SET_ROOT_NOTE'; payload: RootNote }
  | { type: 'SET_SCALE_TYPE'; payload: ScaleType }
  | { type: 'SET_EDITING_SECTION'; payload: SectionType }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_TRACK_VOLUME'; payload: { sectionId: AudioSectionType; volume: number } }
  | { type: 'SET_TRACK_PAN'; payload: { sectionId: AudioSectionType; pan: number } }
  | { type: 'SET_TRACK_MUTE'; payload: { sectionId: AudioSectionType; muted: boolean } }
  | { type: 'SET_TRACK_SOLO'; payload: { sectionId: AudioSectionType; soloed: boolean } }
  | { type: 'SET_MASTER_VOLUME'; payload: number }
  | { type: 'SET_TEMPO'; payload: number }
  | { type: 'SET_METRONOME'; payload: boolean }
  | { type: 'SET_LOOP'; payload: { enabled: boolean; start?: number; end?: number } }
  | { type: 'UPDATE_AUDIO_LEVELS'; payload: { [key: string]: number } }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const defaultSettings: AppSettings = {
  apiKey: '',
  theme: 'dark',
  snapToGrid: true,
  snapToScale: true
};

const defaultAudioTrackState: AudioTrackState = {
  volume: 80,
  pan: 0,
  muted: false,
  soloed: false
};

const defaultState: AppState = {
  notes: [],
  selectedNoteId: null,
  isPlaying: false,
  currentTime: 0,
  rootNote: 'C',
  scaleType: 'Major',
  settings: defaultSettings,
  editingSection: 'all',
  audio: {
    tracks: {
      chord: { ...defaultAudioTrackState },
      melody: { ...defaultAudioTrackState },
      bass: { ...defaultAudioTrackState },
      arp: { ...defaultAudioTrackState }
    },
    masterVolume: 80,
    tempo: 120,
    metronome: false,
    loop: false,
    loopStart: 0,
    loopEnd: 16,
    audioLevels: {}
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_NOTE':
      return {
        ...state,
        notes: [...state.notes, action.payload]
      };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id
            ? { ...note, ...action.payload.updates }
            : note
        )
      };
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload),
        selectedNoteId: state.selectedNoteId === action.payload ? null : state.selectedNoteId
      };
    case 'SELECT_NOTE':
      return {
        ...state,
        selectedNoteId: action.payload
      };
    case 'CLEAR_NOTES':
      return {
        ...state,
        notes: [],
        selectedNoteId: null
      };
    case 'SET_ROOT_NOTE':
      return {
        ...state,
        rootNote: action.payload
      };
    case 'SET_SCALE_TYPE':
      return {
        ...state,
        scaleType: action.payload
      };
    case 'SET_EDITING_SECTION':
      return {
        ...state,
        editingSection: action.payload
      };
    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload
      };
    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: action.payload
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    case 'SET_TRACK_VOLUME':
      return {
        ...state,
        audio: {
          ...state.audio,
          tracks: {
            ...state.audio.tracks,
            [action.payload.sectionId]: {
              ...state.audio.tracks[action.payload.sectionId],
              volume: action.payload.volume
            }
          }
        }
      };
    case 'SET_TRACK_PAN':
      return {
        ...state,
        audio: {
          ...state.audio,
          tracks: {
            ...state.audio.tracks,
            [action.payload.sectionId]: {
              ...state.audio.tracks[action.payload.sectionId],
              pan: action.payload.pan
            }
          }
        }
      };
    case 'SET_TRACK_MUTE':
      return {
        ...state,
        audio: {
          ...state.audio,
          tracks: {
            ...state.audio.tracks,
            [action.payload.sectionId]: {
              ...state.audio.tracks[action.payload.sectionId],
              muted: action.payload.muted
            }
          }
        }
      };
    case 'SET_TRACK_SOLO':
      return {
        ...state,
        audio: {
          ...state.audio,
          tracks: {
            ...state.audio.tracks,
            [action.payload.sectionId]: {
              ...state.audio.tracks[action.payload.sectionId],
              soloed: action.payload.soloed
            }
          }
        }
      };
    case 'SET_MASTER_VOLUME':
      return {
        ...state,
        audio: {
          ...state.audio,
          masterVolume: action.payload
        }
      };
    case 'SET_TEMPO':
      return {
        ...state,
        audio: {
          ...state.audio,
          tempo: action.payload
        }
      };
    case 'SET_METRONOME':
      return {
        ...state,
        audio: {
          ...state.audio,
          metronome: action.payload
        }
      };
    case 'SET_LOOP':
      return {
        ...state,
        audio: {
          ...state.audio,
          loop: action.payload.enabled,
          ...(action.payload.start !== undefined && { loopStart: action.payload.start }),
          ...(action.payload.end !== undefined && { loopEnd: action.payload.end })
        }
      };
    case 'UPDATE_AUDIO_LEVELS':
      return {
        ...state,
        audio: {
          ...state.audio,
          audioLevels: action.payload
        }
      };
    case 'LOAD_STATE':
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  
  // Initialize undo/redo system
  const {
    saveState,
    undo: undoAction,
    redo: redoAction,
    canUndo,
    canRedo,
    getCurrentHistoryState,
    getUndoDescription,
    getRedoDescription
  } = useUndoRedo({
    maxHistorySize: 50,
    debounceMs: 300
  });

  // Undo function that applies previous state
  const undo = () => {
    undoAction();
    const previousState = getCurrentHistoryState();
    if (previousState) {
      dispatch({ type: 'LOAD_STATE', payload: previousState });
    }
  };

  // Redo function that applies next state
  const redo = () => {
    redoAction();
    const nextState = getCurrentHistoryState();
    if (nextState) {
      dispatch({ type: 'LOAD_STATE', payload: nextState });
    }
  };

  // Setup keyboard shortcuts
  const shortcuts = {
    undo: {
      ...platformShortcut(commonShortcuts.undo),
      handler: undo
    },
    redo: {
      ...platformShortcut(commonShortcuts.redo),
      handler: redo
    },
    redoAlt: {
      ...platformShortcut(commonShortcuts.redoAlt),
      handler: redo
    }
  };

  useKeyboardShortcuts({ shortcuts });

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('korysmiditoolbox-state');
    const savedSettings = localStorage.getItem('korysmiditoolbox-settings');
    
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
      } catch (error) {
        console.error('Failed to parse saved state:', error);
      }
    }
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: parsedSettings });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('korysmiditoolbox-state', JSON.stringify({
      notes: state.notes,
      rootNote: state.rootNote,
      scaleType: state.scaleType
    }));
    
    // Save to undo/redo history
    saveState(state);
  }, [state, saveState]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('korysmiditoolbox-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  const addNote = (note: Omit<MidiNote, 'id'>) => {
    const newNote: MidiNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
  };

  const updateNote = (id: string, updates: Partial<MidiNote>) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { id, updates } });
  };

  const deleteNote = (id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });
  };

  const selectNote = (id: string | null) => {
    dispatch({ type: 'SELECT_NOTE', payload: id });
  };

  const clearNotes = () => {
    dispatch({ type: 'CLEAR_NOTES' });
  };

  const setRootNote = (rootNote: RootNote) => {
    dispatch({ type: 'SET_ROOT_NOTE', payload: rootNote });
  };

  const setScaleType = (scaleType: ScaleType) => {
    dispatch({ type: 'SET_SCALE_TYPE', payload: scaleType });
  };

  const setEditingSection = (section: SectionType) => {
    dispatch({ type: 'SET_EDITING_SECTION', payload: section });
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  // Audio control methods
  const setTrackVolume = (sectionId: AudioSectionType, volume: number) => {
    dispatch({ type: 'SET_TRACK_VOLUME', payload: { sectionId, volume } });
  };

  const setTrackPan = (sectionId: AudioSectionType, pan: number) => {
    dispatch({ type: 'SET_TRACK_PAN', payload: { sectionId, pan } });
  };

  const setTrackMute = (sectionId: AudioSectionType, muted: boolean) => {
    dispatch({ type: 'SET_TRACK_MUTE', payload: { sectionId, muted } });
  };

  const setTrackSolo = (sectionId: AudioSectionType, soloed: boolean) => {
    dispatch({ type: 'SET_TRACK_SOLO', payload: { sectionId, soloed } });
  };

  const setMasterVolume = (volume: number) => {
    dispatch({ type: 'SET_MASTER_VOLUME', payload: volume });
  };

  const setTempo = (tempo: number) => {
    dispatch({ type: 'SET_TEMPO', payload: tempo });
  };

  const setMetronome = (enabled: boolean) => {
    dispatch({ type: 'SET_METRONOME', payload: enabled });
  };

  const setLoop = (enabled: boolean, start?: number, end?: number) => {
    dispatch({ type: 'SET_LOOP', payload: { enabled, start, end } });
  };

  const updateAudioLevels = (levels: { [key: string]: number }) => {
    dispatch({ type: 'UPDATE_AUDIO_LEVELS', payload: levels });
  };

  const value: AppContextType = {
    state,
    dispatch,
    addNote,
    updateNote,
    deleteNote,
    selectNote,
    clearNotes,
    setRootNote,
    setScaleType,
    setEditingSection,
    updateSettings,
    setTrackVolume,
    setTrackPan,
    setTrackMute,
    setTrackSolo,
    setMasterVolume,
    setTempo,
    setMetronome,
    setLoop,
    updateAudioLevels,
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
