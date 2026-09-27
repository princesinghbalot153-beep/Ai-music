import React from 'react';
import { Music2, Radio, Sparkles, ExternalLink, Zap, Disc3 } from 'lucide-react';
import { LyriaModel } from '../types';

interface StudioHeaderProps {
  activeModel: LyriaModel;
  onModelChange: (model: LyriaModel) => void;
  trackCount: number;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  activeModel,
  onModelChange,
  trackCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>Lyria Music Studio</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-950/80 border border-purple-500/40 text-purple-300">
                AI AUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>Powered by</span>
              <span className="text-cyan-400 font-semibold">Google Lyria 3</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{trackCount} tracks</span>
            </p>
          </div>
        </div>

        {/* Engine Switcher Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => onModelChange('lyria-3-clip-preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeModel === 'lyria-3-clip-preview'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden sm:inline">Lyria 3 Clip</span>
              <span className="sm:hidden">Clip</span>
            </button>
            <button
              type="button"
              onClick={() => onModelChange('lyria-3-pro-preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeModel === 'lyria-3-pro-preview'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Disc3 className="w-3.5 h-3.5 text-purple-200" />
              <span className="hidden sm:inline">Lyria 3 Pro</span>
              <span className="sm:hidden">Pro</span>
            </button>
          </div>

          <a
            href="https://ai.google.dev/gemini-api/docs/models#lyria"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Lyria Documentation"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
