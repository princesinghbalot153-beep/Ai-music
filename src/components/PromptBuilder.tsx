import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Disc3,
  Sliders,
  Wand2,
  Clock,
  Volume2,
  Music,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { LyriaModel, GenerationParams } from '../types';

interface PromptBuilderProps {
  onGenerate: (params: GenerationParams, useSynthFallback?: boolean) => void;
  isGenerating: boolean;
  activeModel: LyriaModel;
  onModelChange: (model: LyriaModel) => void;
  errorInfo?: {
    type: string;
    message: string;
    upgradeUrl?: string;
  } | null;
}

const GENRES = [
  'Lo-Fi Chillhop',
  'Synthwave / Retrowave',
  'Cyberpunk Techno',
  'Cinematic Orchestral',
  'Deep House',
  'Ambient Space Drone',
  'Neo-Classical Piano',
  'Trap & 808 Hip-Hop',
  'Acoustic Indie Folk',
  'Jazz Lounge Fusion',
  'Future Bass',
  'Afrobeats Groove',
];

const MOODS = [
  'Nostalgic',
  'Euphoric & Uplifting',
  'Melancholic & Reflective',
  'High Energy & Driving',
  'Dark & Gritty',
  'Mystical & Dreamy',
  'Chill & Relaxed',
  'Dramatic & Epic',
];

const INSTRUMENT_OPTIONS = [
  'Analog Synth',
  '808 Sub-Bass',
  'Acoustic Drums',
  'Grand Piano',
  'Electric Guitar',
  'Lush Strings & Cello',
  'Saxophone',
  'Vinyl Crackle',
  'Tape Saturation',
  'Atmospheric Reverb',
];

const PRESET_IDEAS = [
  {
    title: 'Rainy Night Tokyo Lo-Fi',
    model: 'lyria-3-clip-preview' as LyriaModel,
    prompt: 'Warm lo-fi chillhop loop with vinyl crackle, gentle Rhodes piano playing seventh chords, boom-bap brushed drums, and soft sub bass',
    genre: 'Lo-Fi Chillhop',
    mood: 'Nostalgic',
    tempo: 78,
    duration: 15,
  },
  {
    title: 'Outrun 1984 Synthwave',
    model: 'lyria-3-clip-preview' as LyriaModel,
    prompt: 'Upbeat 1980s retro synthwave loop, driving gated snare, arpeggiated bassline, neon analog synthesizer lead, nostalgic summer night vibe',
    genre: 'Synthwave / Retrowave',
    mood: 'High Energy & Driving',
    tempo: 124,
    duration: 20,
  },
  {
    title: 'Interstellar Cinematic Odyssey',
    model: 'lyria-3-pro-preview' as LyriaModel,
    prompt: 'Grand cinematic soundtrack with swelling orchestral strings, deep brass crescendos, acoustic French horns, ethereal choir, and dramatic cosmic progression',
    genre: 'Cinematic Orchestral',
    mood: 'Dramatic & Epic',
    tempo: 88,
    duration: 60,
  },
  {
    title: 'Sunset Ibiza Deep House',
    model: 'lyria-3-pro-preview' as LyriaModel,
    prompt: 'Deep melodic house track with four-on-the-floor kick, warm M1 piano stabs, plucky bassline, shimmering hi-hats, and beach sunset euphoria',
    genre: 'Deep House',
    mood: 'Euphoric & Uplifting',
    tempo: 122,
    duration: 45,
  },
];

export const PromptBuilder: React.FC<PromptBuilderProps> = ({
  onGenerate,
  isGenerating,
  activeModel,
  onModelChange,
  errorInfo,
}) => {
  const [prompt, setPrompt] = useState(
    'Warm analog synthwave loop with driving bassline, retro drums, and glowing neon leads'
  );
  const [genre, setGenre] = useState('Synthwave / Retrowave');
  const [mood, setMood] = useState('High Energy & Driving');
  const [tempo, setTempo] = useState(120);
  const [keyScale, setKeyScale] = useState('A Minor');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([
    'Analog Synth',
    '808 Sub-Bass',
    'Atmospheric Reverb',
  ]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Set duration default according to model
  const [duration, setDuration] = useState(activeModel === 'lyria-3-clip-preview' ? 15 : 60);

  // When model changes, adjust recommended duration
  const handleModelSelect = (newModel: LyriaModel) => {
    onModelChange(newModel);
    if (newModel === 'lyria-3-clip-preview') {
      setDuration(15);
    } else {
      setDuration(60);
    }
  };

  const toggleInstrument = (inst: string) => {
    if (selectedInstruments.includes(inst)) {
      setSelectedInstruments(selectedInstruments.filter((i) => i !== inst));
    } else {
      setSelectedInstruments([...selectedInstruments, inst]);
    }
  };

  // AI Prompt Enhancement
  const handleEnhancePrompt = async () => {
    if (isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/music/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: prompt,
          genre,
          mood,
          tempo,
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (err) {
      console.error('Enhance failed:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Load a quick inspiration preset
  const loadPreset = (p: (typeof PRESET_IDEAS)[0]) => {
    setPrompt(p.prompt);
    handleModelSelect(p.model);
    setGenre(p.genre);
    setMood(p.mood);
    setTempo(p.tempo);
    setDuration(p.duration);
  };

  const handleSubmit = (useSynth = false) => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(
      {
        prompt: prompt.trim(),
        model: activeModel,
        genre,
        mood,
        tempo,
        keyScale,
        duration,
        instruments: selectedInstruments,
      },
      useSynth
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-2xl backdrop-blur-xl space-y-5">
      {/* Model Selection Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
          <span>Choose Lyria Generation Engine</span>
          <span className="text-[11px] text-purple-400 font-normal">Google DeepMind</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Lyria 3 Clip Preview */}
          <button
            type="button"
            onClick={() => handleModelSelect('lyria-3-clip-preview')}
            className={`text-left p-3.5 rounded-xl border transition relative overflow-hidden ${
              activeModel === 'lyria-3-clip-preview'
                ? 'bg-gradient-to-br from-cyan-950/70 to-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-900/20 ring-1 ring-cyan-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="font-bold text-sm text-white">Lyria 3 Clip</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-900/50 text-cyan-300 border border-cyan-700/40">
                ≤ 30s Clips
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fast loops, hooks, beats, sound stems, and song intros. Perfect for rapid musical prototyping.
            </p>
          </button>

          {/* Lyria 3 Pro Preview */}
          <button
            type="button"
            onClick={() => handleModelSelect('lyria-3-pro-preview')}
            className={`text-left p-3.5 rounded-xl border transition relative overflow-hidden ${
              activeModel === 'lyria-3-pro-preview'
                ? 'bg-gradient-to-br from-purple-950/70 to-slate-900 border-purple-500/80 shadow-lg shadow-purple-900/20 ring-1 ring-purple-500/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Disc3 className="w-4 h-4" />
                </span>
                <span className="font-bold text-sm text-white">Lyria 3 Pro</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-700/40">
                Full Tracks
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full-length compositions with multi-section arrangements, intricate harmonies, and master polish.
            </p>
          </button>
        </div>
      </div>

      {/* Preset Inspirations */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono uppercase text-[11px]">Quick Inspirations</span>
          <span className="text-[11px] text-slate-500">Click to load</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {PRESET_IDEAS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(preset)}
              className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-purple-900/40 hover:border-purple-500/50 border border-slate-700/60 text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              <Music className="w-3 h-3 text-purple-400" />
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Musical Prompt & Vision
          </label>
          <button
            type="button"
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 disabled:opacity-50 transition px-2 py-0.5 rounded-md hover:bg-purple-950/40"
            title="Use Gemini to expand your idea with professional production terminology"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
            <span>{isEnhancing ? 'Enhancing...' : '✨ Enhance Prompt with AI'}</span>
          </button>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your desired sound, mood, instruments, rhythm, and textures..."
            className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition leading-relaxed resize-none shadow-inner"
          />
        </div>
      </div>

      {/* Quick Selectors (Genre, Mood, Tempo) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Genre */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-slate-400">Genre</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full rounded-lg bg-slate-950/80 border border-slate-700/80 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Mood */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-slate-400">Vibe / Mood</label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full rounded-lg bg-slate-950/80 border border-slate-700/80 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Tempo BPM */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span>TEMPO</span>
            <span className="text-purple-400 font-bold">{tempo} BPM</span>
          </div>
          <input
            type="range"
            min={60}
            max={180}
            value={tempo}
            onChange={(e) => setTempo(parseInt(e.target.value))}
            className="w-full h-1.5 mt-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Advanced Sound Design Toggler */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition py-1"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>{showAdvanced ? 'Hide Sound Design Stems' : 'Show Sound Design Stems & Key'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 animate-fadeIn">
            {/* Key / Scale and Target Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Musical Key</label>
                <select
                  value={keyScale}
                  onChange={(e) => setKeyScale(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-slate-200"
                >
                  <option value="A Minor">A Minor (Melancholic / Dark)</option>
                  <option value="C Major">C Major (Uplifting / Bright)</option>
                  <option value="D Minor">D Minor (Serious / Epic)</option>
                  <option value="E Minor">E Minor (Driving / Intense)</option>
                  <option value="F Major">F Major (Warm / Peaceful)</option>
                  <option value="G Major">G Major (Triumphant)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">
                  Target Length: {duration} seconds
                </label>
                <input
                  type="range"
                  min={activeModel === 'lyria-3-clip-preview' ? 5 : 30}
                  max={activeModel === 'lyria-3-clip-preview' ? 30 : 180}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-1.5 mt-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Instrument Stems Checklist */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400">Instrument Stems</label>
              <div className="flex flex-wrap gap-1.5">
                {INSTRUMENT_OPTIONS.map((inst) => {
                  const active = selectedInstruments.includes(inst);
                  return (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => toggleInstrument(inst)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition flex items-center gap-1 ${
                        active
                          ? 'bg-purple-900/50 border-purple-500 text-purple-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-purple-400" />}
                      <span>{inst}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Free Tier Notice Banner if applicable */}
      {errorInfo && errorInfo.type === 'RATE_LIMIT_FREE_TIER' && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">
                Lyria Models Free Tier Notice
              </p>
              <p className="text-amber-200/90 mt-0.5">
                Google DeepMind Lyria models ({activeModel}) require a Gemini API pay-as-you-go tier (free tier limit is 0 requests/day).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://ai.dev/rate-limit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 underline font-semibold hover:text-white"
            >
              Upgrade API Tier &rarr;
            </a>
            <span className="text-amber-400/50">•</span>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="text-cyan-300 underline font-medium hover:text-white"
            >
              Generate with Studio Synthesizer Preview
            </button>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isGenerating || !prompt.trim()}
          className="w-full sm:flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-xl shadow-purple-600/30 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.99] flex items-center justify-center gap-2.5"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                {activeModel === 'lyria-3-clip-preview'
                  ? 'Generating Lyria Clip (≤30s)...'
                  : 'Composing Lyria Pro Track...'}
              </span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current text-cyan-300" />
              <span>
                Generate with {activeModel === 'lyria-3-clip-preview' ? 'Lyria 3 Clip' : 'Lyria 3 Pro'}
              </span>
            </>
          )}
        </button>

        {/* Instant Synthesizer Preview button */}
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isGenerating}
          className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5"
          title="Instant procedural Web Audio synthesis preview matching your prompt and BPM"
        >
          <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Synth Preview</span>
        </button>
      </div>
    </div>
  );
};
