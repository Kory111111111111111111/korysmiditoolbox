import React from 'react';
import { Button } from './ui/Button';
import { useApp } from '@/context/AppContext';

interface UndoRedoControlsProps {
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UndoRedoControls({ 
  className = '',
  showLabels = false,
  size = 'md'
}: UndoRedoControlsProps) {
  const { undo, redo, canUndo, canRedo, getUndoDescription, getRedoDescription } = useApp();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        onClick={undo}
        disabled={!canUndo}
        variant="ghost"
        size="sm"
        className={`${sizeClasses[size]} ${!canUndo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'} transition-all duration-200`}
        title={canUndo ? `Undo: ${getUndoDescription()}` : 'Nothing to undo'}
        aria-label={`Undo${canUndo ? `: ${getUndoDescription()}` : ''}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        {showLabels && <span className="ml-1">Undo</span>}
      </Button>

      <Button
        onClick={redo}
        disabled={!canRedo}
        variant="ghost"
        size="sm"
        className={`${sizeClasses[size]} ${!canRedo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'} transition-all duration-200`}
        title={canRedo ? `Redo: ${getRedoDescription()}` : 'Nothing to redo'}
        aria-label={`Redo${canRedo ? `: ${getRedoDescription()}` : ''}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
        {showLabels && <span className="ml-1">Redo</span>}
      </Button>
    </div>
  );
}

// Keyboard shortcut display component
export function KeyboardShortcutTooltip({ children, shortcut }: { children: React.ReactNode; shortcut: string }) {
  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {shortcut}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
}