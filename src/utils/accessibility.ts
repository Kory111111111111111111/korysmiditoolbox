// Accessibility utilities and enhancements
export interface AccessibilityConfig {
  announcements: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
}

// Screen reader announcements
class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private announceElement: HTMLElement | null = null;

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private createAnnounceElement(): void {
    if (typeof window === 'undefined') return;
    
    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.setAttribute('role', 'status');
    this.announceElement.style.position = 'absolute';
    this.announceElement.style.left = '-10000px';
    this.announceElement.style.width = '1px';
    this.announceElement.style.height = '1px';
    this.announceElement.style.overflow = 'hidden';
    this.announceElement.id = 'sr-announcer';
    
    document.body.appendChild(this.announceElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof window === 'undefined') return;
    
    if (!this.announceElement) {
      this.createAnnounceElement();
    }

    if (this.announceElement) {
      this.announceElement.setAttribute('aria-live', priority);
      this.announceElement.textContent = message;
      
      // Clear after announcement to allow repeated messages
      setTimeout(() => {
        if (this.announceElement) {
          this.announceElement.textContent = '';
        }
      }, 1000);
    }
  }

  announceImmediate(message: string): void {
    this.announce(message, 'assertive');
  }
}

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
  
  static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.focusStack.push(activeElement);
    }
  }
  
  static restoreFocus(): void {
    const lastFocused = this.focusStack.pop();
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }
  
  static moveFocus(direction: 'next' | 'previous' | 'first' | 'last', container?: HTMLElement): void {
    const root = container || document;
    const focusableElements = root.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
    
    let targetIndex: number;
    
    switch (direction) {
      case 'next':
        targetIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'previous':
        targetIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
      case 'first':
        targetIndex = 0;
        break;
      case 'last':
        targetIndex = focusableElements.length - 1;
        break;
    }
    
    if (focusableElements[targetIndex]) {
      focusableElements[targetIndex].focus();
    }
  }
}

// Color contrast utilities
export const colorUtils = {
  // Check if colors meet WCAG contrast requirements
  checkContrast(foreground: string, background: string): { ratio: number; aa: boolean; aaa: boolean } {
    const getLuminance = (color: string): number => {
      // Simple luminance calculation (would need more robust implementation)
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      
      const [r, g, b] = rgb.map(val => {
        const num = parseInt(val) / 255;
        return num <= 0.03928 ? num / 12.92 : Math.pow((num + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      aa: ratio >= 4.5,
      aaa: ratio >= 7
    };
  }
};

// Motion preferences
export const motionUtils = {
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  getAnimationClass(normalClass: string, reducedClass: string = ''): string {
    return this.prefersReducedMotion() ? reducedClass : normalClass;
  }
};

// Keyboard navigation helpers
export const keyboardUtils = {
  isNavigationKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Tab'].includes(key);
  },
  
  isActionKey(key: string): boolean {
    return ['Enter', ' ', 'Escape'].includes(key);
  },
  
  handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      wrap?: boolean;
      columns?: number;
    } = {}
  ): number {
    const { orientation = 'vertical', wrap = true, columns } = options;
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          if (columns) {
            newIndex = Math.max(0, currentIndex - columns);
          } else {
            newIndex = wrap && currentIndex === 0 ? items.length - 1 : Math.max(0, currentIndex - 1);
          }
          event.preventDefault();
        }
        break;
        
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          if (columns) {
            newIndex = Math.min(items.length - 1, currentIndex + columns);
          } else {
            newIndex = wrap && currentIndex === items.length - 1 ? 0 : Math.min(items.length - 1, currentIndex + 1);
          }
          event.preventDefault();
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = wrap && currentIndex === 0 ? items.length - 1 : Math.max(0, currentIndex - 1);
          event.preventDefault();
        }
        break;
        
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = wrap && currentIndex === items.length - 1 ? 0 : Math.min(items.length - 1, currentIndex + 1);
          event.preventDefault();
        }
        break;
        
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
        
      case 'End':
        newIndex = items.length - 1;
        event.preventDefault();
        break;
    }
    
    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }
    
    return newIndex;
  }
};

// Accessible form utilities
export const formUtils = {
  generateId(prefix = 'field'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  createFieldAssociation(input: HTMLElement, label?: HTMLElement, description?: HTMLElement, error?: HTMLElement): void {
    const inputId = input.id || this.generateId();
    input.id = inputId;
    
    if (label) {
      label.setAttribute('for', inputId);
    }
    
    const describedBy: string[] = [];
    
    if (description) {
      const descId = description.id || this.generateId('desc');
      description.id = descId;
      describedBy.push(descId);
    }
    
    if (error) {
      const errorId = error.id || this.generateId('error');
      error.id = errorId;
      error.setAttribute('role', 'alert');
      describedBy.push(errorId);
    }
    
    if (describedBy.length > 0) {
      input.setAttribute('aria-describedby', describedBy.join(' '));
    }
  }
};

// Export singleton instance
export const screenReader = ScreenReaderAnnouncer.getInstance();

// Accessibility status announcements for MIDI app
export const midiAnnouncements = {
  noteAdded: (pitch: string, time: number) => 
    screenReader.announce(`Note ${pitch} added at beat ${Math.round(time * 4) / 4}`),
    
  noteDeleted: (pitch: string) => 
    screenReader.announce(`Note ${pitch} deleted`),
    
  noteUpdated: (pitch: string, property: string) => 
    screenReader.announce(`Note ${pitch} ${property} updated`),
    
  playbackStarted: () => 
    screenReader.announce('Playback started'),
    
  playbackStopped: () => 
    screenReader.announce('Playback stopped'),
    
  chordGenerated: (count: number) => 
    screenReader.announce(`Generated chord progression with ${count} notes`),
    
  exported: (format: string) => 
    screenReader.announce(`Exported as ${format} file`),
    
  undoRedo: (action: string, description?: string) => 
    screenReader.announce(`${action}${description ? `: ${description}` : ''}`),
    
  settingChanged: (setting: string, value: string) => 
    screenReader.announce(`${setting} changed to ${value}`)
};
