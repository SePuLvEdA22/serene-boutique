import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'Switch&Tech — Accesorios elegantes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#faf7f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#3d2c2a',
          }}
        >
          Switch&Tech
        </div>
        <div
          style={{
            fontSize: 28,
            marginTop: 16,
            color: '#725856',
            fontWeight: 400,
          }}
        >
          Accesorios tecnológicos con estilo
        </div>
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            gap: 16,
          }}
        >
          {['Fundas', 'Cargadores', 'Termos', 'Personalizados'].map(
            (cat) => (
              <div
                key={cat}
                style={{
                  padding: '8px 24px',
                  borderRadius: 999,
                  background: '#e8dfdc',
                  color: '#3d2c2a',
                  fontSize: 18,
                }}
              >
                {cat}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
