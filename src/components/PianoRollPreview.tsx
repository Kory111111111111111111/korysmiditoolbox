import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MidiNote, SectionType } from '@/types';
import { drawMiniPianoRoll, segmentNotesForPreview } from '@/utils/midiUtils';
import { getNoteName } from '@/utils/midiUtils';

interface SectionProps {
  title: string;
  notes: MidiNote[];
  theme: 'light' | 'dark';
  style: { top: string; bottom: string; border: string; glow: string };
  playheadX?: number;
  onSectionClick?: (sectionType: string) => void;
}

function MiniSection({ title, notes, theme, style, playheadX, onSectionClick }: SectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Calculate canvas dimensions to match grid
  const beatsPerBar = 4;
  const bars = 4;
  const beatWidth = 26;
  const totalBeats = beatsPerBar * bars;
  const canvasWidth = totalBeats * beatWidth; // 416px for 4 bars
  const canvasHeight = 120;

  const rangeLabel = useMemo(() => {
    if (!notes || notes.length === 0) return '—';
    const min = notes.reduce((m, n) => (n.pitch < m ? n.pitch : m), notes[0].pitch);
    const max = notes.reduce((m, n) => (n.pitch > m ? n.pitch : m), notes[0].pitch);
    return `${getNoteName(min)} – ${getNoteName(max)}`;
  }, [notes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawMiniPianoRoll(
      ctx,
      { width: canvasWidth, height: canvasHeight, noteHeight: 6, beatWidth },
      notes,
      theme,
      { style, hoverX: hoverX ?? playheadX ?? null, showBarNumbers: true }
    );
  }, [notes, theme, style, hoverX, playheadX, canvasWidth, canvasHeight, beatWidth]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: style.bottom }} />
          <h3 className="text-body-sm text-white">{title}</h3>
        </div>
        <div className="text-caption text-gray-400 flex items-center gap-3">
          <span>{notes.length} notes</span>
          <span className="hidden md:inline">{rangeLabel}</span>
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden shadow-inner cursor-pointer hover:border-gray-600 transition-colors" onClick={() => onSectionClick?.(title.toLowerCase())}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full"
          onMouseMove={(e) => {
            const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
            setHoverX(e.clientX - rect.left);
          }}
          onMouseLeave={() => setHoverX(null)}
        />
      </div>
    </div>
  );
}

interface PianoRollPreviewProps {
  onSectionClick?: (sectionType: SectionType) => void;
}

export default function PianoRollPreview({ onSectionClick }: PianoRollPreviewProps = {}) {
  const { state, setEditingSection } = useApp();
  const theme = 'dark';
  
  // Calculate consistent beatWidth for playhead
  const beatWidth = 26;

  const segmented = useMemo(() => segmentNotesForPreview(state.notes), [state.notes]);
  const playheadX = state.currentTime * (beatWidth / 2); // keep preview in sync with editor scaling

  const handleSectionClick = (sectionType: string) => {
    const section = sectionType as SectionType;
    setEditingSection(section);
    onSectionClick?.(section);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MiniSection
        title="Chord"
        notes={segmented.chord}
        theme={theme}
        style={{ top: '#22c55e', bottom: '#16a34a', border: '#10b981', glow: 'rgba(34,197,94,0.35)' }}
        playheadX={playheadX}
        onSectionClick={handleSectionClick}
      />
      <MiniSection
        title="Melody"
        notes={segmented.melody}
        theme={theme}
        style={{ top: '#60a5fa', bottom: '#3b82f6', border: '#0ea5e9', glow: 'rgba(96,165,250,0.35)' }}
        playheadX={playheadX}
        onSectionClick={handleSectionClick}
      />
      <MiniSection
        title="Bass"
        notes={segmented.bass}
        theme={theme}
        style={{ top: '#f59e0b', bottom: '#d97706', border: '#f59e0b', glow: 'rgba(245,158,11,0.35)' }}
        playheadX={playheadX}
        onSectionClick={handleSectionClick}
      />
      <MiniSection
        title="Arp"
        notes={segmented.arp}
        theme={theme}
        style={{ top: '#a78bfa', bottom: '#8b5cf6', border: '#a78bfa', glow: 'rgba(167,139,250,0.35)' }}
        playheadX={playheadX}
        onSectionClick={handleSectionClick}
      />
    </div>
  );
}


