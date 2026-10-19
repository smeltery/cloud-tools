'use client';
import { useState } from 'react';
import { Copy } from 'lucide-react';
const colors = [
  ['Paper', '#f7fbff', 'A light canvas for the work ahead.'],
  ['Ink', '#172b43', 'Clear words and confident actions.'],
  ['Blue', '#2767c7', 'A familiar accent for a little direction.'],
  ['Soft blue', '#e8f3ff', 'A welcoming home for related ideas.'],
  ['White', '#ffffff', 'A fresh surface for useful things.'],
];
export function BrandPalette() {
  const [status, setStatus] = useState('');
  return (
    <>
      <ul className="palette">
        {colors.map(([name, hex, description]) => (
          <li key={hex}>
            <button
              className="swatch"
              aria-label={`Copy ${name} hex ${hex}`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(hex);
                  setStatus(`Copied ${name}: ${hex}`);
                } catch {
                  setStatus(`Could not copy. Select this value instead: ${hex}`);
                }
              }}
            >
              <span className="color" style={{ background: hex }} aria-hidden="true" />
              <span className="swatch-label">
                <strong>{name}</strong>
                <span className="hex">{hex}</span>
                <Copy className="copy" size={14} />
              </span>
            </button>
            <p className="fine">{description}</p>
          </li>
        ))}
      </ul>
      <p className="palette-status fine" role="status">
        {status}
      </p>
    </>
  );
}
