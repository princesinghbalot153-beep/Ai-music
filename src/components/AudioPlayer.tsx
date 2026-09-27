import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Download,
  Share2,
  Music2,
  Sparkles,
} from 'lucide-react';
import { MusicTrack } from '../types';

interface AudioPlayerProps {
  track: MusicTrack | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  onPlayPause: () => void;
  onTrackChange?: (track: MusicTrack) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  audioRef,
  isPlaying,
  onPlayPause,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copied, setCopied] = useState(false);

  // Sync audio element time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || track?.duration || 0);
    };
    const handleEnded = () => {
      if (!isLooping) {
        // ended
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, track, isLooping]);

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMute = !isMuted;
    audioRef.current.muted = newMute;
    setIsMuted(newMute);
  };

  const toggleLoop = () => {
    if (!audioRef.current) return;
    const newLoop = !isLooping;
    audioRef.current.loop = newLoop;
    setIsLooping(newLoop);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) {
        onPlayPause();
      }
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = () => {
    if (!track?.audioUrl) return;
    const link = document.createElement('a');
    link.href = track.audioUrl;
    const safeTitle = (track.title || 'Lyria_Music_Track').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = track.mimeType.includes('wav') ? 'wav' : 'mp3';
    link.download = `${safeTitle}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (!track) return;
    navigator.clipboard.writeText(`"${track.title}" - Generated with Google Lyria AI: ${track.prompt}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!track) {
    return (
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <Music2 className="w-4 h-4 text-purple-400 animate-pulse" />
        <span>No track currently selected. Generate a clip or choose one from the library below.</span>
      </div>
    );
  }

  const effectiveDuration = duration || track.duration || 15;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl space-y-4">
      {/* Track Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                {track.title}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${
                  track.model === 'lyria-3-clip-preview'
                    ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                    : 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                }`}
              >
                {track.model === 'lyria-3-clip-preview' ? '⚡ Lyria 3 Clip (≤30s)' : '🎼 Lyria 3 Pro'}
              </span>
              {track.isSynthesized && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/70 border border-amber-600/40 text-amber-300">
                  Synthesized Preview
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-xl">
              {track.prompt}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1.5"
            title="Copy prompt & details"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden md:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-lg shadow-purple-600/30"
            title="Download audio file"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Scrubber / Progress Bar */}
      <div className="space-y-1.5">
        <div className="relative group">
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 focus:outline-none transition"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #06b6d4 ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-500">
            {track.metadata?.tempo ? `${track.metadata.tempo} BPM • ` : ''}
            {effectiveDuration ? formatTime(effectiveDuration) : '--:--'}
          </span>
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left Side Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition"
            title="Restart track"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleLoop}
            className={`p-2 rounded-lg transition ${
              isLooping
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                : 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title={isLooping ? 'Looping enabled' : 'Enable loop'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            onClick={cycleSpeed}
            className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 font-mono text-xs transition"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Center Primary Play/Pause Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 hover:scale-105 active:scale-95 transition"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Right Side Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
