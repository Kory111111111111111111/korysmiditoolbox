import { useCallback, useRef, useState, useEffect } from 'react';
import { AppState, MidiNote } from '@/types';

// Serializable action types for undo/redo
export type UndoableAction = 
  | { type: 'ADD_NOTE'; payload: MidiNote }
  | { type: 'DELETE_NOTE'; payload: { id: string; deletedNote: MidiNote } }
  | { type: 'UPDATE_NOTE'; payload: { id: string; oldNote: MidiNote; newNote: MidiNote } }
  | { type: 'CLEAR_NOTES'; payload: { clearedNotes: MidiNote[] } }
  | { type: 'BULK_EDIT'; payload: { actions: UndoableAction[] } };

interface HistoryState {
  states: AppState[];
  currentIndex: number;
  maxHistorySize: number;
}

interface UseUndoRedoProps {
  maxHistorySize?: number;
  debounceMs?: number;
  excludeFields?: (keyof AppState)[];
}

export function useUndoRedo({
  maxHistorySize = 50,
  debounceMs = 500,
  excludeFields = ['isPlaying', 'currentTime', 'selectedNoteId']
}: UseUndoRedoProps = {}) {
  const [history, setHistory] = useState<HistoryState>({
    states: [],
    currentIndex: -1,
    maxHistorySize
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');

  // Create a clean state for comparison (excluding specified fields)
  const createCleanState = useCallback((state: AppState): Partial<AppState> => {
    const cleanState = { ...state };
    excludeFields.forEach(field => {
      delete cleanState[field];
    });
    return cleanState;
  }, [excludeFields]);

  // Save state to history with debouncing
  const saveState = useCallback((state: AppState, immediate = false) => {
    const cleanState = createCleanState(state);
    const stateString = JSON.stringify(cleanState);
    
    // Don't save if state hasn't actually changed
    if (stateString === lastSavedStateRef.current) {
      return;
    }

    const doSave = () => {
      setHistory(prev => {
        // If we're not at the end of history, truncate everything after current position
        const newStates = prev.currentIndex >= 0 
          ? [...prev.states.slice(0, prev.currentIndex + 1), state]
          : [state];

        // Limit history size
        const trimmedStates = newStates.length > prev.maxHistorySize
          ? newStates.slice(-prev.maxHistorySize)
          : newStates;

        const newIndex = trimmedStates.length - 1;

        return {
          ...prev,
          states: trimmedStates,
          currentIndex: newIndex
        };
      });

      lastSavedStateRef.current = stateString;
    };

    if (immediate) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      doSave();
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(doSave, debounceMs);
    }
  }, [createCleanState, debounceMs]);

  // Undo operation
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.currentIndex <= 0) {
        return prev; // Can't undo further
      }

      const newIndex = prev.currentIndex - 1;
      return {
        ...prev,
        currentIndex: newIndex
      };
    });
  }, []);

  // Redo operation
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.currentIndex >= prev.states.length - 1) {
        return prev; // Can't redo further
      }

      const newIndex = prev.currentIndex + 1;
      return {
        ...prev,
        currentIndex: newIndex
      };
    });
  }, []);

  // Get current state from history
  const getCurrentHistoryState = useCallback((): AppState | null => {
    if (history.currentIndex >= 0 && history.currentIndex < history.states.length) {
      return history.states[history.currentIndex];
    }
    return null;
  }, [history]);

  // Check if undo/redo is available
  const canUndo = history.currentIndex > 0;
  const canRedo = history.currentIndex < history.states.length - 1;

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory({
      states: [],
      currentIndex: -1,
      maxHistorySize
    });
    lastSavedStateRef.current = '';
  }, [maxHistorySize]);

  // Get action description for UI feedback
  const getUndoDescription = useCallback((): string | null => {
    if (!canUndo || history.currentIndex <= 0) return null;
    
    const currentState = history.states[history.currentIndex];
    const previousState = history.states[history.currentIndex - 1];
    
    // Simple heuristic to determine what changed
    if (currentState.notes.length > previousState.notes.length) {
      return 'Add note';
    } else if (currentState.notes.length < previousState.notes.length) {
      return 'Delete note';
    } else if (currentState.notes.length === 0 && previousState.notes.length > 0) {
      return 'Clear all notes';
    } else if (JSON.stringify(currentState.notes) !== JSON.stringify(previousState.notes)) {
      return 'Edit note';
    } else if (currentState.rootNote !== previousState.rootNote) {
      return 'Change root note';
    } else if (currentState.scaleType !== previousState.scaleType) {
      return 'Change scale';
    }
    
    return 'Unknown action';
  }, [canUndo, history]);

  const getRedoDescription = useCallback((): string | null => {
    if (!canRedo || history.currentIndex >= history.states.length - 1) return null;
    
    const currentState = history.states[history.currentIndex];
    const nextState = history.states[history.currentIndex + 1];
    
    // Simple heuristic to determine what will change
    if (nextState.notes.length > currentState.notes.length) {
      return 'Add note';
    } else if (nextState.notes.length < currentState.notes.length) {
      return 'Delete note';
    } else if (nextState.notes.length === 0 && currentState.notes.length > 0) {
      return 'Clear all notes';
    } else if (JSON.stringify(nextState.notes) !== JSON.stringify(currentState.notes)) {
      return 'Edit note';
    } else if (nextState.rootNote !== currentState.rootNote) {
      return 'Change root note';
    } else if (nextState.scaleType !== currentState.scaleType) {
      return 'Change scale';
    }
    
    return 'Unknown action';
  }, [canRedo, history]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrentHistoryState,
    clearHistory,
    getUndoDescription,
    getRedoDescription,
    historyLength: history.states.length,
    currentIndex: history.currentIndex
  };
}