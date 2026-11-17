import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam } from '../components/PageCam';
import { Cursor } from '../components/Cursor';
import { THEME } from '../theme';
import voData from '../voData.json';

export const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Camera push-in from scale 1.00 to 1.06
  const camScale = interpolate(frame, [0, 112], [1.0, 1.06], {
    extrapolateRight: 'clamp',
  });

  // Cursor motion: enters at 0.95s (frame 28), arrives at start button at 1.95s (frame 58), clicks at 2.05s (frame 61)
  const cursorX = interpolate(frame, [28, 58], [1100, 1480], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [28, 58], [750, 560], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorVisible = frame >= 28 && frame <= 85;
  const isClicking = frame >= 61 && frame <= 66;
  const clickProgress = interpolate(frame, [61, 72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // State flip at 2.14s (frame 64)
  const isRunning = frame >= 64;

  // Spring transition for the running badge pop
  const badgeSpring = spring({
    frame: frame - 64,
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  // VO words from voData line 1
  const line1 = voData.lines[0];

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: THEME.colors.bgPaper,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <PageCam scale={camScale}>
        <div
          style={{
            width: 1920,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Headline statement */}
          <div
            style={{
              position: 'absolute',
              top: 220,
              left: 240,
              display: 'flex',
              alignItems: 'baseline',
              gap: '16px',
            }}
          >
            <span
              style={{
                fontFamily: THEME.fonts.serif,
                fontSize: 64,
                fontWeight: 600,
                color: THEME.colors.textInk,
                letterSpacing: '-0.02em',
              }}
            >
              Kodenya sudah jadi
            </span>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: isRunning ? THEME.colors.statusRunning : THEME.colors.accent,
                boxShadow: isRunning ? `0 0 12px ${THEME.colors.statusRunning}` : 'none',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          {/* Real Card UI Presentation */}
          <div
            style={{
              position: 'absolute',
              top: 360,
              width: 1440,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: THEME.shadows.card,
              borderRadius: THEME.radii.lg,
              border: `1px solid ${THEME.colors.border}`,
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            {/* Header tab strip simulation */}
            <div
              style={{
                height: 48,
                backgroundColor: '#FAFAFA',
                borderBottom: `1px solid ${THEME.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10B981' }} />
              </div>
              <span
                style={{
                  fontFamily: THEME.fonts.sans,
                  fontSize: 13,
                  fontWeight: 500,
                  color: THEME.colors.textMuted,
                  marginLeft: 12,
                }}
              >
                1sLabs Portal &mdash; Node.js Applications
              </span>
            </div>

            {/* High-res authentic card crop */}
            <div style={{ position: 'relative', width: 1440, height: 216, overflow: 'hidden' }}>
              <img
                src={staticFile(isRunning ? 'shots/h3_card_running.png' : 'shots/h3_card_stopped.png')}
                alt="Node App Row"
                style={{
                  width: 1440,
                  height: 'auto',
                  display: 'block',
                  transform: isRunning ? `scale(${1 + 0.005 * badgeSpring})` : 'scale(1)',
                }}
              />
            </div>
          </div>

          {/* Cursor */}
          <Cursor
            x={cursorX}
            y={cursorY}
            clicking={isClicking}
            clickProgress={clickProgress}
            visible={cursorVisible}
          />
        </div>
      </PageCam>
    </div>
  );
};
