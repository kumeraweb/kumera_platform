import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f6f6f3',
          color: '#111111',
          position: 'relative',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: 32,
            background: '#111111',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 180,
            fontWeight: 800
          }}
        >
          K
        </div>
      </div>
    ),
    size
  );
}
