import React from 'react';

export type MascotMood = 'neutral' | 'happy' | 'celebrating' | 'thinking' | 'comforting';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  message?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'neutral',
  size = 72,
  className = '',
  message
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 select-none transition-transform duration-200 hover:scale-105"
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Shadows under feet */}
          <ellipse cx="60" cy="112" rx="36" ry="6" fill="#000000" opacity="0.12" />

          {/* Feet (Orange chunky claws) */}
          <ellipse cx="44" cy="108" rx="10" ry="5" fill="#FF9600" />
          <ellipse cx="76" cy="108" rx="10" ry="5" fill="#FF9600" />

          {/* Main Body (Duolingo-style chubby green owl) */}
          <path
            d="M 22 62 C 20 28 36 12 60 12 C 84 12 100 28 98 62 C 98 88 88 106 60 106 C 32 106 22 88 22 62 Z"
            fill="#58CC02"
          />

          {/* Body bottom shading / 3D depth */}
          <path
            d="M 24 74 C 30 98 42 106 60 106 C 78 106 90 98 96 74 C 84 94 72 101 60 101 C 48 101 36 94 24 74 Z"
            fill="#46A302"
          />

          {/* Wing Left */}
          {mood === 'happy' || mood === 'celebrating' ? (
            /* Wing waving up */
            <path
              d="M 26 50 C 14 36 4 38 6 52 C 8 66 18 70 28 62 Z"
              fill="#58CC02"
              stroke="#46A302"
              strokeWidth="3"
            />
          ) : (
            /* Wing resting down */
            <path
              d="M 24 52 C 14 56 12 76 22 86 C 26 84 28 72 26 62 Z"
              fill="#58CC02"
              stroke="#46A302"
              strokeWidth="2.5"
            />
          )}

          {/* Wing Right */}
          {mood === 'celebrating' ? (
            /* Both wings up celebrating! */
            <path
              d="M 94 50 C 106 36 116 38 114 52 C 112 66 102 70 92 62 Z"
              fill="#58CC02"
              stroke="#46A302"
              strokeWidth="3"
            />
          ) : mood === 'thinking' ? (
            /* Wing touching chin */
            <path
              d="M 96 66 C 90 56 78 54 72 62 C 76 72 88 78 96 66 Z"
              fill="#58CC02"
              stroke="#46A302"
              strokeWidth="3"
            />
          ) : (
            /* Wing resting down */
            <path
              d="M 96 52 C 106 56 108 76 98 86 C 94 84 92 72 94 62 Z"
              fill="#58CC02"
              stroke="#46A302"
              strokeWidth="2.5"
            />
          )}

          {/* Belly Patch (Soft cream/light green) */}
          <path
            d="M 36 68 C 36 50 46 44 60 44 C 74 44 84 50 84 68 C 84 86 76 98 60 98 C 44 98 36 86 36 68 Z"
            fill="#89E219"
          />
          {/* Feather markings on belly */}
          <path d="M 52 70 Q 60 76 68 70" stroke="#58CC02" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 48 82 Q 60 88 72 82" stroke="#58CC02" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* Massive Cartoon Eyes (The Duolingo Signature) */}
          {/* Eye Left */}
          <circle cx="43" cy="38" r="16" fill="#FFFFFF" stroke="#46A302" strokeWidth="2.5" />
          {/* Eye Right */}
          <circle cx="77" cy="38" r="16" fill="#FFFFFF" stroke="#46A302" strokeWidth="2.5" />

          {/* Pupils & Expressions */}
          {mood === 'happy' || mood === 'celebrating' ? (
            <>
              {/* Happy squint arcs */}
              <path d="M 33 39 Q 43 28 53 39" stroke="#3C3C3C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M 67 39 Q 77 28 87 39" stroke="#3C3C3C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              {/* Rosy blush */}
              <ellipse cx="28" cy="50" rx="5" ry="3" fill="#FF86D0" opacity="0.8" />
              <ellipse cx="92" cy="50" rx="5" ry="3" fill="#FF86D0" opacity="0.8" />
            </>
          ) : mood === 'thinking' ? (
            <>
              {/* Pupils looking up-right */}
              <circle cx="48" cy="34" r="8" fill="#3C3C3C" />
              <circle cx="49" cy="32" r="3" fill="#FFFFFF" />
              <circle cx="82" cy="34" r="8" fill="#3C3C3C" />
              <circle cx="83" cy="32" r="3" fill="#FFFFFF" />
            </>
          ) : mood === 'comforting' ? (
            <>
              {/* Big pleading puppy eyes */}
              <circle cx="44" cy="40" r="9" fill="#3C3C3C" />
              <circle cx="42" cy="37" r="4" fill="#FFFFFF" />
              <circle cx="47" cy="42" r="1.8" fill="#FFFFFF" />
              <circle cx="76" cy="40" r="9" fill="#3C3C3C" />
              <circle cx="74" cy="37" r="4" fill="#FFFFFF" />
              <circle cx="79" cy="42" r="1.8" fill="#FFFFFF" />
              {/* Tear drop */}
              <path d="M 88 46 C 88 49 85 52 83 52 C 81 52 80 49 83 45 C 85 43 88 44 88 46 Z" fill="#1CB0F6" />
            </>
          ) : (
            <>
              {/* Big friendly round eyes looking forward */}
              <circle cx="45" cy="39" r="8.5" fill="#3C3C3C" />
              <circle cx="43" cy="36" r="3.2" fill="#FFFFFF" />
              <circle cx="47" cy="41" r="1.5" fill="#FFFFFF" />
              <circle cx="75" cy="39" r="8.5" fill="#3C3C3C" />
              <circle cx="73" cy="36" r="3.2" fill="#FFFFFF" />
              <circle cx="77" cy="41" r="1.5" fill="#FFFFFF" />
            </>
          )}

          {/* Cute Orange Beak */}
          <polygon points="60,42 51,54 69,54" fill="#FF9600" />
          <polygon points="60,54 54,49 66,49" fill="#E58500" />

          {/* Party Hat for Celebrating Mood */}
          {mood === 'celebrating' && (
            <g>
              <polygon points="60,2 48,22 72,22" fill="#FF4B4B" />
              <polygon points="54,12 60,2 66,12" fill="#FFC800" />
              <circle cx="60" cy="2" r="3" fill="#FFC800" />
              <line x1="48" y1="22" x2="72" y2="22" stroke="#FFFFFF" strokeWidth="2.5" />
            </g>
          )}
        </svg>
      </div>

      {message && (
        <div className="relative bg-white dark:bg-[#202f36] px-4 py-2.5 rounded-2xl border-2 border-b-4 border-[#e5e5e5] dark:border-[#37464f] shadow-sm text-xs md:text-sm font-extrabold text-[#4b4b4b] dark:text-white max-w-xs">
          <p className="leading-snug">{message}</p>
          {/* Speech bubble pointer arrow */}
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white dark:border-r-[#202f36] border-b-[6px] border-b-transparent" />
        </div>
      )}
    </div>
  );
};
