import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam } from '../components/PageCam';
import { THEME } from '../theme';

export const Scene3_Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for logo lockup
  const lockupSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  const logoScale = interpolate(lockupSpring, [0, 1], [0.94, 1.0]);
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Hairline rule draw animation
  const ruleProgress = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle reveal
  const subOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
      <PageCam scale={1.0}>
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
          {/* Logo container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${logoScale})`,
              opacity: logoOpacity,
            }}
          >
            <img
              src={staticFile('img/logo-ink.png')}
              alt="1sLabs Wordmark"
              style={{
                width: 320,
                height: 320,
                objectFit: 'contain',
                filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.08))',
              }}
            />

            {/* Hairline Rule */}
            <div
              style={{
                width: 480 * ruleProgress,
                height: 1,
                backgroundColor: THEME.colors.textInk,
                margin: '24px 0 20px 0',
                opacity: 0.25,
              }}
            />

            {/* Title Statement */}
            <div
              style={{
                fontFamily: THEME.fonts.serif,
                fontSize: 52,
                fontWeight: 600,
                color: THEME.colors.textInk,
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
            >
              Hosting dari 1sLabs.
            </div>

            {/* Subtext */}
            <div
              style={{
                fontFamily: THEME.fonts.sans,
                fontSize: 20,
                color: THEME.colors.textMuted,
                marginTop: '12px',
                opacity: subOpacity,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Modern Runtimes &bull; Single Panel &bull; Direct Deploy
            </div>
          </div>
        </div>
      </PageCam>
    </div>
  );
};

