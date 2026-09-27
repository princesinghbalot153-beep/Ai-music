/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { StudioHeader } from './components/StudioHeader';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AudioPlayer } from './components/AudioPlayer';
import { PromptBuilder } from './components/PromptBuilder';
import { TrackLibrary } from './components/TrackLibrary';
import { MusicTrack, LyriaModel, GenerationParams, VisualizerMode } from './types';
import { synthesizeMusicTrack } from './utils/audioSynth';
import { Sparkles, AlertCircle, Wand2, Music2 } from 'lucide-react';

const STORAGE_KEY = 'lyria_music_studio_tracks_v1';

export default function App() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModel, setActiveModel] = useState<LyriaModel>('lyria-3-clip-preview');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [filterModel, setFilterModel] = useState<'all' | LyriaModel>('all');
  const [errorInfo, setErrorInfo] = useState<{
    type: string;
    message: string;
    upgradeUrl?: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize starter tracks & load from localStorage
  useEffect(() => {
    async function loadInitialTracks() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTracks(parsed);
            setCurrentTrack(parsed[0]);
            return;
          }
        } catch (e) {
          console.error('Failed to parse saved tracks:', e);
        }
      }

      // Generate 2 starter tracks so user has immediate playable audio
      try {
        const synthUrl1 = await synthesizeMusicTrack({
          genre: 'Synthwave / Retrowave',
          tempo: 124,
          duration: 15,
        });

        const synthUrl2 = await synthesizeMusicTrack({
          genre: 'Lo-Fi Chillhop',
          tempo: 78,
          duration: 16,
        });

        const initialTracks: MusicTrack[] = [
          {
            id: 'trk_starter_1',
            title: 'Neon Horizon Drive',
            prompt: 'Upbeat 1980s retro synthwave loop with warm analog bass, driving drum groove, and radiant synth leads',
            model: 'lyria-3-clip-preview',
            audioUrl: synthUrl1,
            mimeType: 'audio/wav',
            duration: 15,
            createdAt: new Date().toISOString(),
            isSynthesized: true,
            metadata: {
              genre: 'Synthwave',
              mood: 'High Energy',
              tempo: 124,
              keyScale: 'A Minor',
              instruments: ['Analog Synth', '808 Sub-Bass', 'Acoustic Drums'],
            },
          },
          {
            id: 'trk_starter_2',
            title: 'Raindrops & Tape Cassettes',
            prompt: 'Gentle lo-fi chillhop beat with vinyl texture, warm Rhodes chords, and boom-bap rhythm',
            model: 'lyria-3-pro-preview',
            audioUrl: synthUrl2,
            mimeType: 'audio/wav',
            duration: 16,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            isSynthesized: true,
            metadata: {
              genre: 'Lo-Fi Chillhop',
              mood: 'Nostalgic',
              tempo: 78,
              keyScale: 'C Major',
              instruments: ['Grand Piano', 'Vinyl Crackle', 'Acoustic Drums'],
            },
          },
        ];

        setTracks(initialTracks);
        setCurrentTrack(initialTracks[0]);
      } catch (err) {
        console.error('Error creating starter audio:', err);
      }
    }

    loadInitialTracks();
  }, []);

  // Save tracks to localStorage
  useEffect(() => {
    if (tracks.length > 0) {
      // Don't save huge data URLs to localStorage to avoid quota issues, but keep track records
      const serializable = tracks.map((t) => ({
        ...t,
        audioUrl: t.audioUrl.startsWith('data:') ? '' : t.audioUrl,
      }));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      } catch {
        // quota exceeded fallback
      }
    }
  }, [tracks]);

  // Handle Play/Pause
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback error:', e);
      });
    }
  };

  // Select a track from library
  const handleSelectTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setErrorInfo(null);
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Auto-play note:', e);
        setIsPlaying(false);
      });
    }
  };

  // Delete a track
  const handleDeleteTrack = (trackId: string) => {
    const updated = tracks.filter((t) => t.id !== trackId);
    setTracks(updated);
    if (currentTrack?.id === trackId) {
      if (updated.length > 0) {
        handleSelectTrack(updated[0]);
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    }
  };

  // Generation Handler
  const handleGenerate = async (params: GenerationParams, useSynthFallback = false) => {
    setIsGenerating(true);
    setErrorInfo(null);
    setStatusMessage(
      useSynthFallback
        ? 'Rendering Studio Synthesizer preview...'
        : `Calling Google ${params.model === 'lyria-3-clip-preview' ? 'Lyria 3 Clip' : 'Lyria 3 Pro'}...`
    );

    try {
      if (useSynthFallback) {
        // Use high-fidelity Web Audio Synthesizer
        const audioUrl = await synthesizeMusicTrack({
          genre: params.genre,
          tempo: params.tempo,
          duration: params.duration || (params.model === 'lyria-3-clip-preview' ? 15 : 30),
          mood: params.mood,
        });

        const newTrack: MusicTrack = {
          id: `trk_${Date.now()}_synth`,
          title: params.prompt.slice(0, 32).trim() || 'Studio Track',
          prompt: params.prompt,
          model: params.model,
          audioUrl,
          mimeType: 'audio/wav',
          duration: params.duration || 15,
          createdAt: new Date().toISOString(),
          isSynthesized: true,
          metadata: {
            genre: params.genre,
            mood: params.mood,
            tempo: params.tempo,
            keyScale: params.keyScale,
            instruments: params.instruments,
          },
        };

        setTracks((prev) => [newTrack, ...prev]);
        handleSelectTrack(newTrack);
        setStatusMessage('Track ready!');
        return;
      }

      // Call Backend Lyria Endpoint
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'RATE_LIMIT_FREE_TIER' || response.status === 429) {
          setErrorInfo({
            type: 'RATE_LIMIT_FREE_TIER',
            message: data.message || 'Lyria models require a pay-as-you-go Gemini API tier.',
            upgradeUrl: data.upgradeUrl || 'https://ai.dev/rate-limit',
          });

          // Offer automatic synthesis preview so user still hears music
          const synthUrl = await synthesizeMusicTrack({
            genre: params.genre,
            tempo: params.tempo,
            duration: params.duration || 15,
            mood: params.mood,
          });

          const fallbackTrack: MusicTrack = {
            id: `trk_${Date.now()}_synth`,
            title: `${params.genre || 'Lyria'} Preview`,
            prompt: params.prompt,
            model: params.model,
            audioUrl: synthUrl,
            mimeType: 'audio/wav',
            duration: params.duration || 15,
            createdAt: new Date().toISOString(),
            isSynthesized: true,
            metadata: {
              genre: params.genre,
              mood: params.mood,
              tempo: params.tempo,
              keyScale: params.keyScale,
              instruments: params.instruments,
            },
          };

          setTracks((prev) => [fallbackTrack, ...prev]);
          handleSelectTrack(fallbackTrack);
          setStatusMessage('Synthesized preview loaded (API Free Tier limited)');
          return;
        }

        throw new Error(data.message || 'Generation failed');
      }

      // Successful Lyria generation!
      const newTrack: MusicTrack = {
        id: data.id,
        title: params.prompt.slice(0, 32).trim() || 'Lyria Master',
        prompt: data.prompt || params.prompt,
        model: data.model || params.model,
        audioUrl: data.audioUrl,
        mimeType: data.mimeType || 'audio/mp3',
        duration: data.duration || params.duration || 15,
        createdAt: data.createdAt || new Date().toISOString(),
        isSynthesized: false,
        metadata: {
          genre: params.genre,
          mood: params.mood,
          tempo: params.tempo,
          keyScale: params.keyScale,
          instruments: params.instruments,
        },
      };

      setTracks((prev) => [newTrack, ...prev]);
      handleSelectTrack(newTrack);
      setStatusMessage('Lyria generated track successfully!');
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorInfo({
        type: 'ERROR',
        message: err.message || 'Could not generate track',
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Studio Header */}
      <StudioHeader
        activeModel={activeModel}
        onModelChange={setActiveModel}
        trackCount={tracks.length}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Status Toast / Banner */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-500/40 text-xs text-purple-200 flex items-center justify-between shadow-lg backdrop-blur animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage('')}
              className="text-purple-400 hover:text-white font-mono text-xs"
            >
              dismiss
            </button>
          </div>
        )}

        {/* Top Grid: Visualizer & Player Deck */}
        <section className="grid grid-cols-1 gap-4">
          <AudioVisualizer
            audioElement={audioRef.current}
            isPlaying={isPlaying}
            mode={visualizerMode}
            onModeChange={setVisualizerMode}
            trackTitle={currentTrack?.title}
            modelName={
              currentTrack
                ? currentTrack.model === 'lyria-3-clip-preview'
                  ? 'Lyria 3 Clip (≤30s)'
                  : 'Lyria 3 Pro'
                : undefined
            }
          />

          <AudioPlayer
            track={currentTrack}
            audioRef={audioRef}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onTrackChange={handleSelectTrack}
          />
        </section>

        {/* Studio Controls Grid: Prompt Builder (Left) & Track Library (Right) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Prompt & Sound Design Studio (7 cols on lg) */}
          <div className="lg:col-span-7">
            <PromptBuilder
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              activeModel={activeModel}
              onModelChange={setActiveModel}
              errorInfo={errorInfo}
            />
          </div>

          {/* Library and Stem Vault (5 cols on lg) */}
          <div className="lg:col-span-5">
            <TrackLibrary
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onSelectTrack={handleSelectTrack}
              onDeleteTrack={handleDeleteTrack}
              filterModel={filterModel}
              onFilterChange={setFilterModel}
            />
          </div>
        </section>
      </main>

      {/* Hidden Master Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />

      {/* Studio Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/90 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <p>Lyria Music Studio • Powered by Google DeepMind Lyria Models & Google GenAI</p>
      </footer>
    </div>
  );
}
