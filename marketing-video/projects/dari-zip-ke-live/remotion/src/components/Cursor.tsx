import React from 'react';
import { THEME } from '../theme';

interface CursorProps {
  x: number;
  y: number;
  clicking?: boolean;
  clickProgress?: number; // 0 to 1 for ripple animation
  visible?: boolean;
}

export const Cursor: React.FC<CursorProps> = ({
  x,
  y,
  clicking = false,
  clickProgress = 0,
  visible = true,
}) => {
  if (!visible) return null;

  const cursorScale = clicking ? 0.9 : 1.0;
  const rippleRadius = clickProgress * 40;
  const rippleOpacity = Math.max(0, 1 - clickProgress);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 850,
        transform: `translate(-2px, -2px) scale(${cursorScale})`,
        transition: 'transform 0.1s ease',
        willChange: 'transform, left, top',
      }}
    >
      {/* Click ripple */}
      {clickProgress > 0 && clickProgress < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: rippleRadius * 2,
            height: rippleRadius * 2,
            borderRadius: '50%',
            backgroundColor: THEME.colors.accentMuted,
            border: `2px solid ${THEME.colors.accent}`,
            transform: `translate(-50%, -50%)`,
            opacity: rippleOpacity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Modern crisp arrow cursor */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.28))',
        }}
      >
        <path
          d="M3 2L10.5 21L13.8 13.8L21 10.5L3 2Z"
          fill="#111215"
          stroke="#FFFFFF"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

