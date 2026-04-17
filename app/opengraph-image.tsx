import { ImageResponse } from 'next/og'

export const alt = 'ActComply — EU AI Act Compliance Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#030712',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top accent line */}
        <div style={{ display: 'flex', width: '64px', height: '4px', background: '#3b82f6', borderRadius: '2px', marginBottom: '48px' }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              background: '#3b82f6',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            AI
          </div>
          <span style={{ fontSize: '28px', fontWeight: 600, color: 'white', letterSpacing: '-0.5px' }}>ActComply</span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: '24px',
            flex: 1,
          }}
        >
          EU AI Act Compliance{' '}
          <span style={{ color: '#3b82f6' }}>in minutes.</span>
        </div>

        {/* Subtext */}
        <div style={{ fontSize: '26px', color: '#9ca3af', marginBottom: '48px', lineHeight: 1.4 }}>
          Risk classification · Compliance roadmap · Audit-ready documentation
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '100px',
              padding: '10px 20px',
            }}
          >
            <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }} />
            <span style={{ fontSize: '20px', color: '#f87171', fontWeight: 500 }}>
              Enforcement begins August 2, 2026
            </span>
          </div>
          <span style={{ fontSize: '20px', color: '#4b5563' }}>getactcomply.com</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
