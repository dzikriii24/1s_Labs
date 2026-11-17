import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam } from '../components/PageCam';
import { THEME } from '../theme';

export const Scene2_Gap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Terminal typing progression between frame 10 (4.08s) and frame 35 (4.91s)
  const fullCmd = 'npm run dev';
  const charCount = Math.floor(
    interpolate(frame, [10, 32], [0, fullCmd.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const typedCmd = fullCmd.substring(0, charCount);

  // Terminal output shows at frame 38
  const showServerReady = frame >= 38;

  // Browser error state triggers around frame 104 (7.2s mark)
  const isErrorState = frame >= 104;

  // Statement 1: "Di laptop, semuanya jalan." (revealed early, dims at frame 95)
  const stmt1Opacity = interpolate(frame, [5, 20, 95, 110], [0, 1, 1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Statement 2: "Di internet, belum." (springs up at frame 100)
  const stmt2Spring = spring({
    frame: frame - 100,
    fps,
    config: { damping: 15, stiffness: 140 },
  });
  const stmt2Opacity = interpolate(frame, [100, 112], [0, 1], {
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
      <PageCam scale={1.02} rotateX={2} rotateY={-1}>
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
          {/* Kinetic Statements Header */}
          <div
            style={{
              position: 'absolute',
              top: 140,
              left: 200,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontFamily: THEME.fonts.serif,
                fontSize: 54,
                fontWeight: 600,
                color: THEME.colors.textInk,
                opacity: stmt1Opacity,
                letterSpacing: '-0.02em',
              }}
            >
              Di laptop, semuanya jalan.
            </div>

            {frame >= 100 && (
              <div
                style={{
                  fontFamily: THEME.fonts.serif,
                  fontSize: 54,
                  fontWeight: 600,
                  color: '#DC2626', // Warning / contrast red
                  opacity: stmt2Opacity,
                  transform: `translateY(${interpolate(stmt2Spring, [0, 1], [15, 0])}px)`,
                  letterSpacing: '-0.02em',
                }}
              >
                Di internet, belum.
              </div>
            )}
          </div>

          {/* Windows comparison mockup */}
          <div
            style={{
              position: 'absolute',
              top: 320,
              width: 1520,
              display: 'flex',
              gap: '32px',
            }}
          >
            {/* Terminal Window (Left: Laptop localhost) */}
            <div
              style={{
                flex: 1,
                height: 480,
                backgroundColor: '#1E1E24',
                borderRadius: THEME.radii.lg,
                boxShadow: THEME.shadows.card,
                border: '1px solid #33333E',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: 40,
                  backgroundColor: '#282833',
                  borderBottom: '1px solid #33333E',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  gap: '8px',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF5F56' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27C93F' }} />
                <span style={{ fontFamily: THEME.fonts.mono, fontSize: 12, color: '#A0A0B0', marginLeft: 12 }}>
                  bash &mdash; ~/projects/kopisenja-api
                </span>
              </div>
              <div
                style={{
                  padding: '24px',
                  fontFamily: THEME.fonts.mono,
                  fontSize: 16,
                  color: '#E0E0E0',
                  lineHeight: '1.7',
                }}
              >
                <div style={{ color: '#888899' }}>$ kopisenja-api (main)</div>
                <div>
                  <span style={{ color: '#10B981' }}>➜</span> {typedCmd}
                  {frame < 38 && <span style={{ opacity: (frame % 15 > 7 ? 1 : 0) }}>_</span>}
                </div>
                {showServerReady && (
                  <div style={{ marginTop: '14px', color: '#CBD5E1' }}>
                    <div style={{ color: '#60A5FA' }}>&gt; kopisenja-api@1.0.0 dev</div>
                    <div style={{ color: '#60A5FA' }}>&gt; node index.js</div>
                    <div style={{ marginTop: '10px', color: '#34D399', fontWeight: 600 }}>
                      [READY] Server running on http://localhost:3000
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 14 }}>
                      connected to local MySQL database (port 3306)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Browser Window (Right: Live Internet Attempt) */}
            <div
              style={{
                flex: 1,
                height: 480,
                backgroundColor: '#FFFFFF',
                borderRadius: THEME.radii.lg,
                boxShadow: THEME.shadows.card,
                border: `1px solid ${THEME.colors.border}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Browser Address Bar */}
              <div
                style={{
                  height: 48,
                  backgroundColor: '#FAFAFA',
                  borderBottom: `1px solid ${THEME.colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#D4D4D8' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#D4D4D8' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#D4D4D8' }} />
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    backgroundColor: '#FFFFFF',
                    borderRadius: THEME.radii.sm,
                    border: `1px solid ${THEME.colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    fontFamily: THEME.fonts.sans,
                    fontSize: 13,
                    color: THEME.colors.textInk,
                  }}
                >
                  <span style={{ color: '#9CA3AF' }}>https://</span>kopisenja.1slabs.my.id
                </div>
              </div>

              {/* Browser Content */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '32px',
                  textAlign: 'center',
                }}
              >
                {isErrorState ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        backgroundColor: '#FEE2E2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#EF4444',
                        fontSize: 26,
                        fontWeight: 'bold',
                      }}
                    >
                      !
                    </div>
                    <div
                      style={{
                        fontFamily: THEME.fonts.sans,
                        fontSize: 22,
                        fontWeight: 600,
                        color: THEME.colors.textInk,
                      }}
                    >
                      This site can&apos;t be reached
                    </div>
                    <div
                      style={{
                        fontFamily: THEME.fonts.mono,
                        fontSize: 14,
                        color: THEME.colors.textMuted,
                      }}
                    >
                      ERR_CONNECTION_REFUSED
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: THEME.colors.textSubtle }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '3px solid #E5E7EB',
                        borderTopColor: THEME.colors.accent,
                        transform: `rotate(${frame * 12}deg)`,
                      }}
                    />
                    <span style={{ fontFamily: THEME.fonts.sans, fontSize: 14 }}>Connecting to server...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageCam>
    </div>
  );
};

