const SWATCHES = {
  Terracotta: '#c17a4e',
  Charcoal: '#4a4038',
  'Off White': '#efe6d8',
  Sand: '#dcc4a0',
  Sage: '#8a9a6e',
  'Olive Green': '#6b7a45',
  Pearl: '#e9e2d6',
  Cream: '#f2e6d2',
  Gold: '#c9a35a',
  Oatmeal: '#d9c9ab',
};

const FALLBACK_PALETTE = Object.values(SWATCHES);

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Looks up a known color name first; for anything else (a book title,
// undefined, etc.) picks a deterministic color from the palette so the same
// product always gets the same fallback cover tint.
export function swatchFor(hint) {
  if (!hint) return FALLBACK_PALETTE[0];
  if (SWATCHES[hint]) return SWATCHES[hint];
  return FALLBACK_PALETTE[hashString(hint) % FALLBACK_PALETTE.length];
}

export default SWATCHES;
