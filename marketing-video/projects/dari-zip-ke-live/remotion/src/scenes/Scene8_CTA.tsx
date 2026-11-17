import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam } from '../components/PageCam';
import { THEME } from '../theme';

export const Scene8_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow pull-back scale from 1.05 down to 1.00
  const pullBack = interpolate(frame, [0, 150], [1.04, 1.0], {
    extrapolateRight: 'clamp',
  });

  // Fade in
  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  // Subtle specular light shimmer across the URL text
  const shimmerPos = interpolate(frame, [25, 75], [-100, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade to black at the very end (last 15 frames)
  const fadeOutOpacity = interpolate(frame, [135, 150], [0, 1], {
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
      <PageCam scale={pullBack}>
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
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: interpolate(entranceSpring, [0, 1], [0, 1]),
            }}
          >
            <img
              src={staticFile('img/logo-ink.png')}
              alt="1sLabs Wordmark"
              style={{
                width: 240,
                height: 240,
                objectFit: 'contain',
              }}
            />

            {/* Hairline Rule */}
            <div
              style={{
                width: 380,
                height: 1,
                backgroundColor: THEME.colors.textInk,
                margin: '20px 0 24px 0',
                opacity: 0.2,
              }}
            />

            {/* Headline Call To Action */}
            <div
              style={{
                fontFamily: THEME.fonts.serif,
                fontSize: 38,
                color: THEME.colors.textMuted,
                letterSpacing: '-0.01em',
                marginBottom: '8px',
              }}
            >
              Mulai sekarang di
            </div>

            {/* URL Display with Specular Effect */}
            <div
              style={{
                fontFamily: THEME.fonts.sans,
                fontSize: 68,
                fontWeight: 800,
                color: THEME.colors.textInk,
                letterSpacing: '-0.03em',
                position: 'relative',
                display: 'inline-block',
              }}
            >
              1slabs.my.id/hosting
            </div>

            {/* Reassurance Badges */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginTop: '36px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  color: THEME.colors.textInk,
                  fontFamily: THEME.fonts.sans,
                  fontSize: 15,
                  fontWeight: 500,
                  padding: '10px 22px',
                  borderRadius: THEME.radii.pill,
                  border: `1px solid ${THEME.colors.border}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                }}
              >
                Konsultasi IT Gratis
              </div>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  color: THEME.colors.textMuted,
                  fontFamily: THEME.fonts.sans,
                  fontSize: 15,
                  fontWeight: 500,
                  padding: '10px 22px',
                  borderRadius: THEME.radii.pill,
                  border: `1px solid ${THEME.colors.border}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                }}
              >
                WhatsApp +62 851-5629-6580
              </div>
            </div>
          </div>
        </div>
      </PageCam>

      {/* Fade out to black */}
      {frame >= 135 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#000000',
            opacity: fadeOutOpacity,
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
};

