import { ImageResponse } from 'next/og'

export const alt = 'ActComply: EU AI Act Compliance Platform'
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
          <svg width="52" height="52" viewBox="0 0 100 100" fill="none">
            <path d="M 82 22 A 40 40 0 1 0 82 78" stroke="#FAF8F3" strokeWidth="2.8" strokeLinecap="round"/>
            <path d="M 28 74 L 48 26 L 68 74" stroke="#6A93C4" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="35" y1="58" x2="61" y2="58" stroke="#6A93C4" strokeWidth="2.8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '28px', fontWeight: 300, color: 'white', letterSpacing: '-0.5px' }}>Act<span style={{ fontWeight: 700, color: '#6A93C4' }}>Comply</span></span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: '64px',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: '24px',
            flex: 1,
          }}
        >
          <span>EU AI Act Compliance&nbsp;</span>
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
              Enforcement is live · Annex III from 2 Dec 2027
            </span>
          </div>
          <span style={{ fontSize: '20px', color: '#4b5563' }}>getactcomply.com</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
