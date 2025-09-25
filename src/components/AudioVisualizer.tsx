import React, { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { AudioSectionType } from '@/types';

interface AudioVisualizerProps {
  className?: string;
}

export default function AudioVisualizer({ className = '' }: AudioVisualizerProps) {
  const { state } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (!state.isPlaying) {
        // Static visualization when not playing
        ctx.fillStyle = '#374151';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Audio Visualization', width / 2, height / 2);
        return;
      }

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw bars for each section
      const sections: { id: AudioSectionType; color: string; name: string }[] = [
        { id: 'chord', color: '#22c55e', name: 'Chord' },
        { id: 'melody', color: '#3b82f6', name: 'Melody' },
        { id: 'bass', color: '#f59e0b', name: 'Bass' },
        { id: 'arp', color: '#a855f7', name: 'Arp' }
      ];
      
      const barWidth = width / sections.length;
      const maxBarHeight = height - 40;
      
      sections.forEach((section, index) => {
        const x = index * barWidth;
        const track = state.audio.tracks[section.id];
        const level = state.audio.audioLevels[section.id] || 0;
        
        // Background bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 4, 20, barWidth - 8, maxBarHeight);
        
        // Level bar
        if (!track.muted && (track.soloed || !Object.values(state.audio.tracks).some(t => t.soloed))) {
          const barHeight = Math.max(2, level * maxBarHeight * (track.volume / 100));
          
          // Create gradient
          const gradient = ctx.createLinearGradient(0, 20 + maxBarHeight, 0, 20 + maxBarHeight - barHeight);
          gradient.addColorStop(0, section.color + '40'); // 25% opacity
          gradient.addColorStop(0.5, section.color + '80'); // 50% opacity
          gradient.addColorStop(1, section.color); // 100% opacity
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x + 4, 20 + maxBarHeight - barHeight, barWidth - 8, barHeight);
          
          // Peak indicator
          if (level > 0.8) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(x + 4, 16, barWidth - 8, 2);
          }
        }
        
        // Section label
        ctx.fillStyle = track.muted ? '#6b7280' : '#e2e8f0';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(section.name, x + barWidth / 2, height - 8);
        
        // Volume indicator
        ctx.fillStyle = '#64748b';
        ctx.font = '8px monospace';
        ctx.fillText(`${track.volume}%`, x + barWidth / 2, height - 20);
        
        // Mute/Solo indicators
        if (track.muted) {
          ctx.fillStyle = '#ef4444';
          ctx.fillText('M', x + barWidth / 2 - 15, height - 20);
        }
        if (track.soloed) {
          ctx.fillStyle = '#eab308';
          ctx.fillText('S', x + barWidth / 2 + 15, height - 20);
        }
      });
      
      // Master level indicator
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      const masterLevelY = 20 + maxBarHeight - (state.audio.masterVolume / 100) * maxBarHeight;
      ctx.beginPath();
      ctx.moveTo(0, masterLevelY);
      ctx.lineTo(width, masterLevelY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Master level text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Master: ${state.audio.masterVolume}%`, 4, masterLevelY - 4);
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, state.audio]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={120}
      className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// Compact version for use in footer or small spaces
export function CompactAudioVisualizer({ className = '' }: AudioVisualizerProps) {
  const { state } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Background
      ctx.fillStyle = state.isPlaying ? '#0f172a' : '#374151';
      ctx.fillRect(0, 0, width, height);
      
      if (!state.isPlaying) return;
      
      // Simple bars for each section
      const sections: { id: AudioSectionType; color: string }[] = [
        { id: 'chord', color: '#22c55e' },
        { id: 'melody', color: '#3b82f6' },
        { id: 'bass', color: '#f59e0b' },
        { id: 'arp', color: '#a855f7' }
      ];
      
      const barWidth = (width - 12) / sections.length;
      const maxBarHeight = height - 4;
      
      sections.forEach((section, index) => {
        const x = 2 + index * (barWidth + 1);
        const track = state.audio.tracks[section.id];
        const level = state.audio.audioLevels[section.id] || 0;
        
        if (!track.muted && (track.soloed || !Object.values(state.audio.tracks).some(t => t.soloed))) {
          const barHeight = Math.max(1, level * maxBarHeight * (track.volume / 100));
          
          ctx.fillStyle = section.color;
          ctx.fillRect(x, height - 2 - barHeight, barWidth, barHeight);
        }
      });
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, state.audio]);

  return (
    <canvas
      ref={canvasRef}
      width={60}
      height={20}
      className={`bg-gray-800 rounded ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}