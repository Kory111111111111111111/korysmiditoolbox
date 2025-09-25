import { useEffect, useCallback, useRef } from 'react';

export type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  description: string;
  category?: string;
};

export type ShortcutHandler = () => void;

interface UseKeyboardShortcutsProps {
  shortcuts: Record<string, KeyboardShortcut & { handler: ShortcutHandler }>;
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventDefault = true
}: UseKeyboardShortcutsProps) {
  const shortcutsRef = useRef(shortcuts);
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    for (const [id, shortcut] of Object.entries(shortcutsRef.current)) {
      const matches = (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.metaKey === !!shortcut.metaKey
      );

      if (matches) {
        if (preventDefault || shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler();
        break; // Only handle the first matching shortcut
      }
    }
  }, [enabled, preventDefault]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  // Utility function to format shortcut display
  const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.metaKey) parts.push('Cmd');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    
    parts.push(shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1));
    
    return parts.join(' + ');
  }, []);

  // Get shortcuts grouped by category
  const getShortcutsByCategory = useCallback(() => {
    const grouped: Record<string, Array<{ id: string; shortcut: KeyboardShortcut & { handler: ShortcutHandler } }>> = {};
    
    Object.entries(shortcuts).forEach(([id, shortcut]) => {
      const category = shortcut.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ id, shortcut });
    });
    
    return grouped;
  }, [shortcuts]);

  return {
    formatShortcut,
    getShortcutsByCategory
  };
}

// Pre-defined common shortcuts
export const commonShortcuts = {
  undo: {
    key: 'z',
    ctrlKey: true,
    description: 'Undo last action',
    category: 'Edit'
  },
  redo: {
    key: 'y',
    ctrlKey: true,
    description: 'Redo last undone action',
    category: 'Edit'
  },
  redoAlt: {
    key: 'z',
    ctrlKey: true,
    shiftKey: true,
    description: 'Redo last undone action',
    category: 'Edit'
  },
  copy: {
    key: 'c',
    ctrlKey: true,
    description: 'Copy selected items',
    category: 'Edit'
  },
  paste: {
    key: 'v',
    ctrlKey: true,
    description: 'Paste copied items',
    category: 'Edit'
  },
  selectAll: {
    key: 'a',
    ctrlKey: true,
    description: 'Select all items',
    category: 'Edit'
  },
  delete: {
    key: 'Delete',
    description: 'Delete selected items',
    category: 'Edit'
  },
  escape: {
    key: 'Escape',
    description: 'Cancel current action',
    category: 'General'
  },
  save: {
    key: 's',
    ctrlKey: true,
    description: 'Save project',
    category: 'File'
  },
  play: {
    key: ' ',
    description: 'Play/Pause',
    category: 'Playback'
  },
  stop: {
    key: ' ',
    shiftKey: true,
    description: 'Stop playback',
    category: 'Playback'
  },
  // Piano Roll specific shortcuts
  pianoRollOpen: {
    key: 'e',
    ctrlKey: true,
    description: 'Open Piano Roll Editor',
    category: 'Navigation'
  },
  settings: {
    key: ',',
    ctrlKey: true,
    description: 'Open Settings',
    category: 'Navigation'
  },
  help: {
    key: 'F1',
    description: 'Show Help',
    category: 'Navigation'
  },
  // Note editing
  addNote: {
    key: 'n',
    ctrlKey: true,
    description: 'Add new note',
    category: 'Piano Roll'
  },
  duplicateNote: {
    key: 'd',
    ctrlKey: true,
    description: 'Duplicate selected notes',
    category: 'Piano Roll'
  },
  // Navigation
  focusNext: {
    key: 'Tab',
    description: 'Move to next element',
    category: 'Navigation'
  },
  focusPrevious: {
    key: 'Tab',
    shiftKey: true,
    description: 'Move to previous element',
    category: 'Navigation'
  },
  // Export shortcuts
  exportMidi: {
    key: 'm',
    ctrlKey: true,
    shiftKey: true,
    description: 'Export as MIDI',
    category: 'Export'
  },
  exportWav: {
    key: 'w',
    ctrlKey: true,
    shiftKey: true,
    description: 'Export as WAV',
    category: 'Export'
  },
  // Generation
  generate: {
    key: 'g',
    ctrlKey: true,
    description: 'Generate chord progression',
    category: 'Generation'
  },
  clear: {
    key: 'l',
    ctrlKey: true,
    shiftKey: true,
    description: 'Clear all notes',
    category: 'Edit'
  }
} as const;

// Platform-specific modifier detection
export const isMac = typeof window !== 'undefined' && 
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);

// Adjust shortcuts for platform
export function platformShortcut(shortcut: KeyboardShortcut): KeyboardShortcut {
  if (isMac && shortcut.ctrlKey) {
    return {
      ...shortcut,
      ctrlKey: false,
      metaKey: true
    };
  }
  return shortcut;
}