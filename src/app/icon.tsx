import { ImageResponse } from 'next/og';

export const contentType = 'image/png';

export function generateImageMetadata() {
  return [
    { id: '32', size: { width: 32, height: 32 } },
    { id: '192', size: { width: 192, height: 192 } },
    { id: '512', size: { width: 512, height: 512 } },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  const fontSize = Math.round(size * 0.55);
  const borderRadius = Math.round(size * 0.2);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          borderRadius,
          background: '#725856',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          fontWeight: 700,
          fontSize,
          color: '#ffffff',
        }}
      >
        S&T
      </div>
    ),
    { width: size, height: size },
  );
}
