import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import demoStory from '../data/demoKaraokeStory.json';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, ChevronLeft,
  Music, Sparkles, BookOpen, Clock, Globe, ArrowLeft,
  HelpCircle, Eye, EyeOff
} from 'lucide-react';
import clsx from 'clsx';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function KaraokeNoteReader({ noteData }) {
  const navigate = useNavigate();
  const story = noteData || demoStory;

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(story.duration || 42.35);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [hoveredVocab, setHoveredVocab] = useState(null);

  const activeSentenceRef = useRef(null);
  const autoScrollEnabled = useRef(true);

  const sentences = story.sentences || [];
  const allWords = (story.words && story.words.length > 0)
    ? story.words
    : (sentences.flatMap(s => s.words || []) || []);

  // Determine active sentence and active word based on currentTime
  const activeSentenceIndex = sentences.findIndex(
    s => currentTime >= s.start && currentTime <= s.end + 0.3
  );

  const activeWord = allWords.find(
    w => currentTime >= w.start && currentTime <= w.end
  );

  // Auto-scroll to active sentence
  useEffect(() => {
    if (activeSentenceRef.current && autoScrollEnabled.current && isPlaying) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSentenceIndex, isPlaying]);

  // Audio time update handler
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || story.duration);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const jumpToWord = (wordStartTime) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = wordStartTime;
    setCurrentTime(wordStartTime);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={story.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/notes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors group px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Notes
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className={clsx(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
              showTranslations
                ? 'bg-dolphin-500/20 text-dolphin-300 border-dolphin-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            )}
            title="Toggle English sentence translations"
          >
            {showTranslations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Translations {showTranslations ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Story Header */}
      <div className="glass-card p-6 mb-6 border border-white/10 bg-gradient-to-r from-dolphin-600/10 via-ocean-600/10 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white shadow-xl shadow-dolphin-900/40 flex-shrink-0 mt-0.5">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-dolphin-500 text-white px-2.5 py-0.5 rounded-full shadow-md">
                  🎵 Karaoke Note
                </span>
                <span className="badge badge-purple text-xs px-2.5 py-0.5">{story.subject}</span>
                <span className="badge badge-blue text-xs px-2.5 py-0.5">{story.topic}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{story.title}</h1>
              <p className="text-gray-400 text-sm italic mt-0.5">{story.englishTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/5 px-3 py-2 rounded-xl border border-white/5 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-dolphin-400" />
            <span>Duration: {formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Sticky Glass Audio Controller Bar */}
      <div className="sticky top-20 z-40 mb-8 glass-card p-4 sm:p-5 border border-dolphin-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3">
          {/* Timeline slider and times */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-dolphin-300 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-dolphin-400"
              />
            </div>
            <span className="text-xs font-mono text-gray-400 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Play/Pause & Restart */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className={clsx(
                  'w-11 h-11 rounded-full flex items-center justify-center text-white transition-all shadow-lg cursor-pointer',
                  isPlaying
                    ? 'bg-gradient-to-r from-dolphin-500 to-ocean-500 shadow-dolphin-500/50 scale-105 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                )}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Hint message */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Click on any word to jump audio & listen</span>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {[0.75, 1.0, 1.25].map(rate => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    playbackRate === rate
                      ? 'bg-dolphin-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Karaoke Reading Text Container */}
      <div className="glass-card p-6 sm:p-10 border border-white/10 space-y-6">
        {story.sentences.map((sentence, sIdx) => {
          const isSentenceActive = sIdx === activeSentenceIndex;

          return (
            <div
              key={sIdx}
              ref={isSentenceActive ? activeSentenceRef : null}
              className={clsx(
                'p-4 sm:p-5 rounded-2xl transition-all duration-300 relative',
                isSentenceActive
                  ? 'bg-dolphin-500/10 border border-dolphin-500/30 shadow-lg shadow-dolphin-950/40 scale-[1.01]'
                  : 'hover:bg-white/[0.02] border border-transparent'
              )}
            >
              {/* Spoken sentence index badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  isSentenceActive
                    ? 'bg-dolphin-500 text-white'
                    : 'bg-white/10 text-gray-400'
                )}>
                  {sIdx + 1}
                </span>
                {isSentenceActive && (
                  <span className="text-[11px] font-semibold text-dolphin-400 animate-pulse">
                    Currently Reading...
                  </span>
                )}
              </div>

              {/* German Words with Live Karaoke Highlighting */}
              <p className="text-lg sm:text-xl md:text-2xl leading-relaxed sm:leading-loose text-gray-300 font-medium">
                {sentence.words.map((w, wIdx) => {
                  const isWordActive =
                    activeWord &&
                    activeWord.sentenceIndex === sIdx &&
                    activeWord.start === w.start;

                  const isWordPast = currentTime > w.end;
                  const vocabDefinition = story.vocab?.[w.clean];

                  return (
                    <span
                      key={wIdx}
                      onClick={() => jumpToWord(w.start)}
                      onMouseEnter={() => vocabDefinition && setHoveredVocab({ word: w.clean, meaning: vocabDefinition })}
                      onMouseLeave={() => setHoveredVocab(null)}
                      className={clsx(
                        'inline-block px-1.5 py-0.5 rounded-lg mx-0.5 transition-all duration-150 cursor-pointer select-none relative group',
                        isWordActive
                          ? 'bg-gradient-to-r from-dolphin-500 to-ocean-500 text-white font-extrabold scale-110 shadow-lg shadow-dolphin-500/50 z-20'
                          : isWordPast
                          ? 'text-white'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                      )}
                      title={vocabDefinition ? `Click to listen • Meaning: ${vocabDefinition}` : 'Click to listen from here'}
                    >
                      {w.word}

                      {/* Small subtle dot if word has vocabulary tooltip */}
                      {vocabDefinition && !isWordActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full opacity-60" />
                      )}
                    </span>
                  );
                })}
              </p>

              {/* English Sentence Translation */}
              {showTranslations && (
                <p className="mt-2.5 text-xs sm:text-sm text-gray-500 italic pl-7 border-l-2 border-dolphin-500/30">
                  {sentence.translation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Vocabulary Tooltip (Bottom Bar) */}
      {hoveredVocab && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-5 py-2.5 border border-amber-500/40 rounded-full shadow-2xl flex items-center gap-3 animate-slide-up bg-gray-950/90">
          <span className="text-sm font-bold text-amber-300">{hoveredVocab.word}:</span>
          <span className="text-sm font-medium text-white">{hoveredVocab.meaning}</span>
        </div>
      )}

      {/* Bottom Vocabulary List Card */}
      <div className="mt-8 glass-card p-6 border border-white/10">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-dolphin-400" />
          Story Vocabulary & Key Phrases
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {Object.entries(story.vocab || {}).map(([de, en]) => (
            <div key={de} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <span className="font-bold text-dolphin-300 block">{de}</span>
              <span className="text-gray-400 block mt-0.5">{en}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
