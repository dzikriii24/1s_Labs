import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam } from '../components/PageCam';
import { Cursor } from '../components/Cursor';
import { THEME } from '../theme';

export const Scene5_Portal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase timeline:
  // Phase 1 (frame 0-45): App list view
  // Phase 2 (frame 45-170): Create dialog & configuration
  // Phase 3 (frame 170-210): Start app click & status badge green
  // Phase 4 (frame 210-260): Streaming console logs
  const showModal = frame >= 45 && frame < 175;
  const isStarted = frame >= 195;
  const showLogs = frame >= 210;

  // Dialog step index through el_create_*.png
  const dialogFrameIndex = Math.min(
    13,
    Math.floor(interpolate(frame, [50, 160], [0, 13], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  );
  const dialogPadded = String(dialogFrameIndex).padStart(2, '0');

  // Modal spring entrance
  const modalSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  // Logs drawer slide-in spring
  const logsSpring = spring({
    frame: frame - 210,
    fps,
    config: { damping: 16, stiffness: 130 },
  });

  // Cursor movements
  const cursorX = interpolate(
    frame,
    [10, 45, 175, 192, 215],
    [1500, 1420, 1420, 1480, 1200],
    { extrapolateRight: 'clamp' }
  );
  const cursorY = interpolate(
    frame,
    [10, 45, 175, 192, 215],
    [800, 240, 240, 560, 750],
    { extrapolateRight: 'clamp' }
  );
  const isClicking = (frame >= 43 && frame <= 47) || (frame >= 190 && frame <= 194);
  const clickProgress = interpolate(
    frame,
    [190, 202],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

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
          {/* Main Statement Header */}
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: 240,
              display: 'flex',
              alignItems: 'baseline',
              gap: '20px',
              opacity: showModal ? 0.2 : 1,
            }}
          >
            <span
              style={{
                fontFamily: THEME.fonts.serif,
                fontSize: 48,
                fontWeight: 600,
                color: THEME.colors.textInk,
                letterSpacing: '-0.02em',
              }}
            >
              {frame < 80 ? 'Buat aplikasi.' : frame < 170 ? 'Pilih versi Node.js.' : 'Jalankan & pantau lognya.'}
            </span>
            <span
              style={{
                fontFamily: THEME.fonts.sans,
                fontSize: 16,
                color: THEME.colors.textMuted,
                backgroundColor: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: THEME.radii.pill,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              Node.js v20 &bull; Express API &bull; Live Process
            </span>
          </div>

          {/* Portal Base Card */}
          <div
            style={{
              position: 'absolute',
              top: 180,
              width: 1440,
              height: 720,
              backgroundColor: '#FFFFFF',
              borderRadius: THEME.radii.lg,
              boxShadow: THEME.shadows.card,
              border: `1px solid ${THEME.colors.border}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top Bar */}
            <div
              style={{
                height: 52,
                backgroundColor: '#FAFAFA',
                borderBottom: `1px solid ${THEME.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: THEME.fonts.sans, fontWeight: 600, fontSize: 15, color: THEME.colors.textInk }}>
                  Node.js App Manager
                </span>
                <span
                  style={{
                    backgroundColor: isStarted ? THEME.colors.statusRunningBg : THEME.colors.statusStoppedBg,
                    color: isStarted ? THEME.colors.statusRunning : THEME.colors.statusStopped,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: THEME.radii.pill,
                  }}
                >
                  {isStarted ? '1 RUNNING' : '1 STOPPED'}
                </span>
              </div>
              <div
                style={{
                  backgroundColor: THEME.colors.accent,
                  color: '#FFFFFF',
                  fontFamily: THEME.fonts.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '7px 16px',
                  borderRadius: THEME.radii.pill,
                }}
              >
                + Buat Aplikasi
              </div>
            </div>

            {/* Application Row Image */}
            <div style={{ position: 'relative', width: 1440, height: 216, overflow: 'hidden' }}>
              <img
                src={staticFile(isStarted ? 'shots/el_card_running.png' : 'shots/el_card_stopped.png')}
                alt="App Row"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Stats section */}
            <div style={{ padding: '20px 24px', borderTop: `1px solid ${THEME.colors.border}` }}>
              <img
                src={staticFile(isStarted ? 'shots/el_stats_running.png' : 'shots/h3_stats_stopped.png')}
                alt="Process Stats"
                style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>

          {/* Modal Dialog Overlay: Create App Progression */}
          {showModal && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                backgroundColor: 'rgba(17, 18, 21, 0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 800,
                opacity: interpolate(modalSpring, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: 680,
                  backgroundColor: '#FFFFFF',
                  borderRadius: THEME.radii.lg,
                  boxShadow: THEME.shadows.modal,
                  border: `1px solid ${THEME.colors.border}`,
                  overflow: 'hidden',
                  transform: `scale(${interpolate(modalSpring, [0, 1], [0.94, 1.0])})`,
                }}
              >
                {/* Native modal image containing the complete dialog */}
                <img
                  src={staticFile(`shots/el_create_${dialogPadded}.png`)}
                  alt="Create Wizard Step"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* Live Streaming Logs Drawer */}
          {showLogs && (
            <div
              style={{
                position: 'absolute',
                bottom: 120,
                right: 280,
                width: 860,
                backgroundColor: '#1E1E24',
                borderRadius: THEME.radii.lg,
                boxShadow: THEME.shadows.modal,
                border: '1px solid #33333E',
                overflow: 'hidden',
                zIndex: 810,
                transform: `translateY(${interpolate(logsSpring, [0, 1], [150, 0])}px)`,
                opacity: interpolate(logsSpring, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  height: 38,
                  backgroundColor: '#282833',
                  borderBottom: '1px solid #33333E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ fontFamily: THEME.fonts.mono, fontSize: 13, color: '#E0E0E0' }}>
                    Live Logs &bull; kopisenja-api (PID 4092)
                  </span>
                </div>
                <span style={{ fontFamily: THEME.fonts.mono, fontSize: 11, color: '#888899' }}>
                  Streaming stdout
                </span>
              </div>
              <img
                src={staticFile('shots/el_logs.png')}
                alt="Console Logs"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          )}

          {/* Cursor */}
          <Cursor
            x={cursorX}
            y={cursorY}
            clicking={isClicking}
            clickProgress={clickProgress}
            visible={true}
          />
        </div>
      </PageCam>
    </div>
  );
};
