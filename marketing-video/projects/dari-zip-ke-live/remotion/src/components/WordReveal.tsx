import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { THEME } from '../theme';

interface WordTiming {
  text: string;
  start: number;
  end: number;
}

interface WordRevealProps {
  words?: WordTiming[];
  text?: string;
  currentTimeSeconds: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  highlightColor?: string;
  style?: React.CSSProperties;
}

export const WordReveal: React.FC<WordRevealProps> = ({
  words,
  text,
  currentTimeSeconds,
  fontFamily = THEME.fonts.serif,
  fontSize = 52,
  color = THEME.colors.textInk,
  highlightColor = THEME.colors.accent,
  style = {},
}) => {
  if (words && words.length > 0) {
    return (
      <div
        style={{
          fontFamily,
          fontSize,
          color,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'baseline',
          letterSpacing: '-0.02em',
          ...style,
        }}
      >
        {words.map((w, i) => {
          const isActive = currentTimeSeconds >= w.start && currentTimeSeconds <= w.end + 0.15;
          const isPassed = currentTimeSeconds > w.end + 0.15;
          const isRevealed = currentTimeSeconds >= w.start;

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: isRevealed ? 1 : 0.25,
                color: isActive ? highlightColor : isPassed ? color : THEME.colors.textSubtle,
                transform: isRevealed ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.15s ease-out',
                fontWeight: isRevealed ? 500 : 400,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    );
  }

  // Fallback simple line reveal if raw text passed
  return (
    <div
      style={{
        fontFamily,
        fontSize,
        color,
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {text}
    </div>
  );
};

