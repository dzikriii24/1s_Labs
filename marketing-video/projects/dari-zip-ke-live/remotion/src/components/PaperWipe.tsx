import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../theme';

interface PaperWipeProps {
  startFrame: number;
  durationInFrames?: number;
  direction?: 'left-to-right' | 'right-to-left';
  color?: string;
}

export const PaperWipe: React.FC<PaperWipeProps> = ({
  startFrame,
  durationInFrames = 18,
  direction = 'left-to-right',
  color = THEME.colors.bgPaper,
}) => {
  const frame = useCurrentFrame();
  const relFrame = frame - startFrame;

  if (relFrame < 0 || relFrame > durationInFrames) {
    return null;
  }

  const progress = interpolate(relFrame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateX =
    direction === 'left-to-right'
      ? interpolate(progress, [0, 1], [-105, 105])
      : interpolate(progress, [0, 1], [105, -105]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 800,
        pointerEvents: 'none',
        transform: `translateX(${translateX}%)`,
        backgroundColor: color,
        boxShadow:
          direction === 'left-to-right'
            ? '15px 0 35px -5px rgba(0, 0, 0, 0.18)'
            : '-15px 0 35px -5px rgba(0, 0, 0, 0.18)',
      }}
    />
  );
};

