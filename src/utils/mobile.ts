// Mobile and touch support utilities

export interface TouchEvent {
  touches: Touch[];
  changedTouches: Touch[];
  targetTouches: Touch[];
  preventDefault(): void;
  stopPropagation(): void;
}

export interface Touch {
  identifier: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  target: EventTarget;
}

// Device detection utilities
export const deviceUtils = {
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  isTablet(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(navigator.userAgent) || 
           (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
  },
  
  isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  getViewportSize() {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  },
  
  getDevicePixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
  },
  
  isLandscape(): boolean {
    const { width, height } = this.getViewportSize();
    return width > height;
  },
  
  hasHover(): boolean {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(hover: hover)').matches;
  }
};

// Touch gesture recognition
export class TouchGestureRecognizer {
  private startTouches: Touch[] = [];
  private startTime: number = 0;
  private threshold = {
    tap: { maxDistance: 10, maxTime: 300 },
    longPress: { maxDistance: 10, minTime: 500 },
    swipe: { minDistance: 50, maxTime: 300 },
    pinch: { minDistance: 10 }
  };

  onTouchStart(event: TouchEvent, callbacks: {
    onTap?: (x: number, y: number) => void;
    onLongPress?: (x: number, y: number) => void;
    onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void;
    onPinch?: (scale: number, centerX: number, centerY: number) => void;
  } = {}) {
    this.startTouches = Array.from(event.touches);
    this.startTime = Date.now();
    
    // Long press detection
    if (callbacks.onLongPress && this.startTouches.length === 1) {
      setTimeout(() => {
        if (this.startTouches.length === 1) {
          const touch = this.startTouches[0];
          const distance = this.getDistance(touch, touch);
          if (distance <= this.threshold.longPress.maxDistance) {
            callbacks.onLongPress!(touch.clientX, touch.clientY);
          }
        }
      }, this.threshold.longPress.minTime);
    }
  }

  onTouchEnd(event: TouchEvent, callbacks: {
    onTap?: (x: number, y: number) => void;
    onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void;
  } = {}) {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    if (this.startTouches.length === 1 && event.changedTouches.length === 1) {
      const startTouch = this.startTouches[0];
      const endTouch = event.changedTouches[0];
      const distance = this.getDistance(startTouch, endTouch);
      
      // Tap detection
      if (callbacks.onTap && distance <= this.threshold.tap.maxDistance && duration <= this.threshold.tap.maxTime) {
        callbacks.onTap(endTouch.clientX, endTouch.clientY);
        return;
      }
      
      // Swipe detection
      if (callbacks.onSwipe && distance >= this.threshold.swipe.minDistance && duration <= this.threshold.swipe.maxTime) {
        const deltaX = endTouch.clientX - startTouch.clientX;
        const deltaY = endTouch.clientY - startTouch.clientY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          const direction = deltaX > 0 ? 'right' : 'left';
          callbacks.onSwipe(direction, Math.abs(deltaX));
        } else {
          const direction = deltaY > 0 ? 'down' : 'up';
          callbacks.onSwipe(direction, Math.abs(deltaY));
        }
      }
    }
    
    this.reset();
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const deltaX = touch1.clientX - touch2.clientX;
    const deltaY = touch1.clientY - touch2.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  private reset() {
    this.startTouches = [];
    this.startTime = 0;
  }
}

// Virtual keyboard support
export const virtualKeyboardUtils = {
  isVirtualKeyboardOpen(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Detect viewport height change on mobile
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const windowHeight = window.innerHeight;
    
    // If viewport is significantly smaller than window, keyboard is likely open
    return viewportHeight < windowHeight * 0.75;
  },
  
  onVirtualKeyboardToggle(callback: (isOpen: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    
    let lastHeight = window.innerHeight;
    
    const handler = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const isOpen = currentHeight < lastHeight * 0.75;
      callback(isOpen);
      lastHeight = currentHeight;
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handler);
      return () => window.visualViewport!.removeEventListener('resize', handler);
    } else {
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    }
  }
};

// Responsive breakpoints
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export const mediaQueries = {
  isMobile: () => deviceUtils.getViewportSize().width < breakpoints.md,
  isTablet: () => {
    const width = deviceUtils.getViewportSize().width;
    return width >= breakpoints.md && width < breakpoints.lg;
  },
  isDesktop: () => deviceUtils.getViewportSize().width >= breakpoints.lg,
  
  getBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
    const width = deviceUtils.getViewportSize().width;
    if (width < breakpoints.xs) return 'xs';
    if (width < breakpoints.sm) return 'sm';
    if (width < breakpoints.md) return 'md';
    if (width < breakpoints.lg) return 'lg';
    if (width < breakpoints.xl) return 'xl';
    return '2xl';
  }
};

// Touch-friendly component utilities
export const touchUtils = {
  // Make elements touch-friendly with appropriate sizing
  makeTouchFriendly(element: HTMLElement, minSize = 44): void {
    const style = element.style;
    style.minWidth = `${minSize}px`;
    style.minHeight = `${minSize}px`;
    style.touchAction = 'manipulation'; // Prevent double-tap zoom
  },
  
  // Add touch ripple effect
  addTouchRipple(element: HTMLElement, duration = 300): void {
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    
    const handleTouch = (event: Event) => {
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('div');
      
      // Position ripple
      const touch = (event as any).touches?.[0] || event as MouseEvent;
      const x = (touch.clientX - rect.left);
      const y = (touch.clientY - rect.top);
      
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.3)';
      ripple.style.transform = 'scale(0)';
      ripple.style.pointerEvents = 'none';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      ripple.style.marginLeft = '-10px';
      ripple.style.marginTop = '-10px';
      ripple.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
      
      element.appendChild(ripple);
      
      // Animate ripple
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(4)';
        ripple.style.opacity = '0';
      });
      
      // Remove ripple
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, duration);
    };
    
    element.addEventListener('touchstart', handleTouch);
    element.addEventListener('mousedown', handleTouch);
  },
  
  // Prevent default touch behaviors
  preventDefaultTouch(element: HTMLElement, options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    passive?: boolean;
  } = {}): void {
    const { preventDefault = true, stopPropagation = false, passive = false } = options;
    
    const handler = (event: Event) => {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
    };
    
    element.addEventListener('touchstart', handler, { passive });
    element.addEventListener('touchmove', handler, { passive });
    element.addEventListener('touchend', handler, { passive });
  }
};

// Orientation utilities
export const orientationUtils = {
  getCurrentOrientation(): 'portrait' | 'landscape' {
    return deviceUtils.isLandscape() ? 'landscape' : 'portrait';
  },
  
  onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const handler = () => {
      callback(this.getCurrentOrientation());
    };
    
    window.addEventListener('orientationchange', handler);
    window.addEventListener('resize', handler);
    
    return () => {
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener('resize', handler);
    };
  },
  
  lockOrientation(orientation: 'portrait' | 'landscape'): Promise<void> {
    if (typeof screen === 'undefined' || !screen.orientation) {
      return Promise.reject(new Error('Screen Orientation API not supported'));
    }
    
    const orientationMap = {
      portrait: 'portrait-primary',
      landscape: 'landscape-primary'
    };
    
    return screen.orientation.lock(orientationMap[orientation] as OrientationLockType);
  }
};

// Safe area utilities for iOS devices
export const safeAreaUtils = {
  getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
    
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0')
    };
  },
  
  applySafeAreaPadding(element: HTMLElement): void {
    element.style.paddingTop = 'env(safe-area-inset-top)';
    element.style.paddingRight = 'env(safe-area-inset-right)';
    element.style.paddingBottom = 'env(safe-area-inset-bottom)';
    element.style.paddingLeft = 'env(safe-area-inset-left)';
  }
};

// Performance utilities for mobile
export const mobilePerformanceUtils = {
  // Throttle touch events for better performance
  throttleTouch<T extends any[]>(
    func: (...args: T) => void,
    delay: number
  ): (...args: T) => void {
    let lastCall = 0;
    return (...args: T) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },
  
  // Debounce resize events
  debounceResize<T extends any[]>(
    func: (...args: T) => void,
    delay: number = 250
  ): (...args: T) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },
  
  // Optimize scroll performance
  optimizeScrolling(element: HTMLElement): void {
    element.style.webkitOverflowScrolling = 'touch';
    element.style.overflowScrolling = 'touch';
    element.style.willChange = 'scroll-position';
  }
};