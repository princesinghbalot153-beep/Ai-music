import React, { useEffect, useRef } from 'react';
import { VisualizerMode } from '../types';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  trackTitle?: string;
  modelName?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  isPlaying,
  mode,
  onModeChange,
  trackTitle,
  modelName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Connect Web Audio API Analyser to HTMLAudioElement
  useEffect(() => {
    if (!audioElement) return;

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }

      const audioCtx = audioCtxRef.current;
      if (!analyserRef.current) {
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
      }

      if (!sourceRef.current) {
        // createMediaElementSource can only be called once per element
        try {
          const source = audioCtx.createMediaElementSource(audioElement);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioCtx.destination);
          sourceRef.current = source;
        } catch {
          // If already connected or CORS issue, handled gracefully
        }
      }

      if (isPlaying && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      console.warn('AudioContext visualizer setup note:', e);
    }
  }, [audioElement, isPlaying]);

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Deep studio background with subtle grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      let dataArray: Uint8Array;
      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
        if (mode === 'wave') {
          analyserRef.current.getByteTimeDomainData(dataArray as any);
        } else {
          analyserRef.current.getByteFrequencyData(dataArray as any);
        }
      } else {
        // Fallback procedural animation when idle or simulated
        const simulatedLength = 64;
        dataArray = new Uint8Array(simulatedLength);
        for (let i = 0; i < simulatedLength; i++) {
          if (isPlaying) {
            const val = Math.sin(time * 2 + i * 0.2) * 50 + Math.cos(time * 3 + i * 0.1) * 30 + 100;
            dataArray[i] = Math.max(10, Math.min(255, val));
          } else {
            dataArray[i] = 12 + Math.sin(time + i * 0.1) * 8;
          }
        }
      }

      if (mode === 'bars') {
        // Frequency Spectrum Bars
        const barCount = Math.min(dataArray.length, 48);
        const barSpacing = 4;
        const totalSpacing = barSpacing * (barCount - 1);
        const barWidth = Math.max(3, (width - 40 - totalSpacing) / barCount);
        const startX = 20;

        for (let i = 0; i < barCount; i++) {
          const rawValue = dataArray[i] || 0;
          const normalized = rawValue / 255;
          const barHeight = Math.max(4, normalized * (height * 0.75));
          const x = startX + i * (barWidth + barSpacing);
          const y = (height - barHeight) / 2;

          // Glowing gradient
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#a855f7'); // Purple
          gradient.addColorStop(0.5, '#6366f1'); // Indigo
          gradient.addColorStop(1, '#06b6d4'); // Cyan

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 3);
          ctx.fill();

          // Reflective bottom glow
          if (isPlaying && normalized > 0.3) {
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
            ctx.fillRect(x, (height + barHeight) / 2 + 4, barWidth, 2);
            ctx.shadowBlur = 0;
          }
        }
      } else if (mode === 'wave') {
        // Oscilloscope Waveform
        ctx.lineWidth = 3;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#10b981');
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();

        // Neon Glow pass
        if (isPlaying) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.stroke();
        }
      } else if (mode === 'circle') {
        // Radial Oscilloscope
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.28;
        const barCount = 48;

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const val = (dataArray[i % dataArray.length] || 10) / 255;
          const barLen = Math.max(5, val * 55);

          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + barLen);
          const y2 = centerY + Math.sin(angle) * (radius + barLen);

          ctx.strokeStyle = `hsl(${(i * 360) / barCount}, 85%, 65%)`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
        ctx.fillStyle = isPlaying ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)';
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, mode]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
      {/* Top Header inside Visualizer */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 font-mono tracking-wide">
              {isPlaying ? 'PLAYING MASTER' : 'STANDBY'}
            </span>
          </div>

          {modelName && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-950/70 border border-purple-600/40 text-purple-300">
              {modelName}
            </span>
          )}
        </div>

        {/* Visualizer Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 backdrop-blur">
          <button
            onClick={() => onModeChange('bars')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              mode === 'bars'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Frequency Bars"
          >
            Bars
          </button>
          <button
            onClick={() => onModeChange('wave')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              mode === 'wave'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Waveform Oscilloscope"
          >
            Wave
          </button>
          <button
            onClick={() => onModeChange('circle')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              mode === 'circle'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Radial Field"
          >
            Radial
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={220}
        className="w-full h-44 sm:h-56 block object-cover"
      />

      {/* Track Overlay at bottom */}
      {trackTitle && (
        <div className="absolute bottom-3 left-4 z-10 pointer-events-none">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">Current Track</p>
          <h3 className="text-sm sm:text-base font-semibold text-white drop-shadow-md truncate max-w-[280px] sm:max-w-md">
            {trackTitle}
          </h3>
        </div>
      )}
    </div>
  );
};
