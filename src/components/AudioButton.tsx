import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface AudioButtonProps {
  word: string;
  size?: 'sm' | 'md' | 'lg';
  rate?: number;
  className?: string;
  showLabel?: boolean;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  word,
  size = 'md',
  rate = 0.9,
  className = '',
  showLabel = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    soundManager.speakWord(word, rate);
    setTimeout(() => {
      setIsPlaying(false);
    }, 1200);
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs gap-1',
    md: 'p-2 text-sm gap-1.5',
    lg: 'p-3 text-base gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={`Pronounce ${word}`}
      title={`Listen to pronunciation of "${word}"`}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 cursor-pointer ${
        isPlaying
          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-500'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200 dark:hover:bg-emerald-800 border border-emerald-200 dark:border-emerald-700 shadow-2xs'
      } ${sizeClasses} ${className}`}
    >
      <Volume2 className={`${iconSizes} ${isPlaying ? 'animate-pulse' : ''}`} />
      {showLabel && (
        <span className="font-semibold">{isPlaying ? 'বাজছে...' : 'উচ্চারণ'}</span>
      )}
    </button>
  );
};
