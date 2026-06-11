import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: '#725856',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          fontWeight: 700,
          fontSize: 100,
          color: '#ffffff',
        }}
      >
        S&T
      </div>
    ),
    { ...size },
  );
}
