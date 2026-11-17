import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam } from '../components/PageCam';
import { THEME } from '../theme';

const TABS = [
  { id: 0, label: 'Overview', file: 'shots/el_tab_overview.png', desc: 'Status server, DNS, dan spesifikasi paket' },
  { id: 1, label: 'File Manager', file: 'shots/el_tab_files.png', desc: 'Drag-and-drop file, ekstrak ZIP, permission' },
  { id: 2, label: 'FTP Accounts', file: 'shots/el_tab_ftp.png', desc: 'Akun transfer file aman dan kredensial terisolasi' },
  { id: 3, label: 'Database MySQL', file: 'shots/el_tab_db.png', desc: 'Kelola tabel, SQL console, impor & ekspor' },
  { id: 4, label: 'Visitor Analytics', file: 'shots/el_tab_analytics.png', desc: 'Pageviews, unique visitors, dan metrik performa' },
];

export const Scene7_Tabs: React.FC = () => {
  const frame = useCurrentFrame();

  // Tab active index based on timeline cue frames
  // tab 0: 0 - 25
  // tab 1: 25 - 60
  // tab 2: 60 - 95
  // tab 3: 95 - 130
  // tab 4: 130 - 204
  const activeTabIdx = frame < 25 ? 0 : frame < 60 ? 1 : frame < 95 ? 2 : frame < 130 ? 3 : 4;
  const currentTab = TABS[activeTabIdx];

  // Tab indicator position
  const indicatorLeft = interpolate(activeTabIdx, [0, 4], [0, 800], {
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
          {/* Statement Header */}
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: 240,
              display: 'flex',
              alignItems: 'baseline',
              gap: '20px',
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
              Satu panel. Lima tab.
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
              Semua kebutuhan hosting dalam satu antarmuka
            </span>
          </div>

          {/* Interactive Navigation Tab Strip Container */}
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
            {/* Tab Bar Header */}
            <div
              style={{
                height: 60,
                backgroundColor: '#FAFAFA',
                borderBottom: `1px solid ${THEME.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', gap: '32px', position: 'relative' }}>
                {TABS.map((t, idx) => {
                  const isActive = idx === activeTabIdx;
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px 0',
                        fontFamily: THEME.fonts.sans,
                        fontSize: 15,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? THEME.colors.accent : THEME.colors.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isActive ? THEME.colors.accent : 'transparent',
                        }}
                      />
                      {t.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tab Content Display */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <img
                src={staticFile(currentTab.file)}
                alt={currentTab.label}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              {/* Bottom Context Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 24,
                  backgroundColor: 'rgba(17, 18, 21, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: THEME.radii.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontFamily: THEME.fonts.sans, fontWeight: 600, fontSize: 14 }}>
                  {currentTab.label}
                </span>
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>&bull; {currentTab.desc}</span>
              </div>
            </div>
          </div>
        </div>
      </PageCam>
    </div>
  );
};

