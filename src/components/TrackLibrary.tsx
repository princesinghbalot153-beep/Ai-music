import React from 'react';
import {
  Play,
  Pause,
  Download,
  Trash2,
  Disc3,
  Zap,
  Music,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MusicTrack, LyriaModel } from '../types';

interface TrackLibraryProps {
  tracks: MusicTrack[];
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  onSelectTrack: (track: MusicTrack) => void;
  onDeleteTrack: (trackId: string) => void;
  filterModel: 'all' | LyriaModel;
  onFilterChange: (filter: 'all' | LyriaModel) => void;
}

export const TrackLibrary: React.FC<TrackLibraryProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onDeleteTrack,
  filterModel,
  onFilterChange,
}) => {
  const filteredTracks = tracks.filter((t) => {
    if (filterModel === 'all') return true;
    return t.model === filterModel;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = (e: React.MouseEvent, track: MusicTrack) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = track.audioUrl;
    const safeTitle = (track.title || 'Lyria_Track').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = track.mimeType.includes('wav') ? 'wav' : 'mp3';
    link.download = `${safeTitle}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    onDeleteTrack(trackId);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white tracking-wide">Studio Track Library</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {tracks.length}
          </span>
        </div>

        {/* Filter by Model */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterModel === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Tracks
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('lyria-3-clip-preview')}
            className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
              filterModel === 'lyria-3-clip-preview'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3 text-cyan-300" />
            <span>Lyria Clip</span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('lyria-3-pro-preview')}
            className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
              filterModel === 'lyria-3-pro-preview'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc3 className="w-3 h-3 text-purple-300" />
            <span>Lyria Pro</span>
          </button>
        </div>
      </div>

      {/* Track List */}
      {filteredTracks.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-xs">
          No tracks matching current filter. Use the generator above to create music.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredTracks.map((track) => {
            const isSelected = currentTrack?.id === track.id;
            const isTrackPlaying = isSelected && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`group relative p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500/70 shadow-lg shadow-purple-900/20 ring-1 ring-purple-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Top info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause icon button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(track);
                      }}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition flex-shrink-0 ${
                        isTrackPlaying
                          ? 'bg-purple-500 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-purple-600 group-hover:text-white'
                      }`}
                    >
                      {isTrackPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition line-clamp-1">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {track.prompt}
                      </p>
                    </div>
                  </div>

                  {/* Model Tag */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border flex-shrink-0 ${
                      track.model === 'lyria-3-clip-preview'
                        ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                        : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                    }`}
                  >
                    {track.model === 'lyria-3-clip-preview' ? 'Clip ≤30s' : 'Pro Track'}
                  </span>
                </div>

                {/* Bottom Metadata & Actions */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900/80 pt-2 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDuration(track.duration)}
                    </span>
                    {track.metadata?.tempo && (
                      <span className="text-slate-500">{track.metadata.tempo} BPM</span>
                    )}
                    {track.metadata?.genre && (
                      <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                        {track.metadata.genre}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, track)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="Download audio"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, track.id)}
                      className="p-1.5 rounded hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition"
                      title="Delete track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
