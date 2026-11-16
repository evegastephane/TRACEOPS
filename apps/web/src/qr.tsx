import React, { useMemo } from 'react';
import QRCode from 'qrcode';

/** A QR code drawn as one SVG path: crisp at any size, printable, readable by every phone camera. */
export function QrCode({ value, size = 160, label }: { value: string; size?: number; label: string }) {
  const { path, n } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' }), count = qr.modules.size;
    let d = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.modules.get(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { path: d, n: count + 8 };
  }, [value]);
  return <svg className="qr" width={size} height={size} viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label} shapeRendering="crispEdges">
    <rect width={n} height={n} fill="#fff" /><path d={path} fill="#17262c" />
  </svg>;
}
