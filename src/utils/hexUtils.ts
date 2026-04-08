// Hex Grid Utilities - Axial Coordinate System
import type { HexCoord } from '@/types/game';

// Size of each hex (distance from center to corner)
export const HEX_SIZE = 50;

// Convert axial coordinates to pixel position
export function hexToPixel(coord: HexCoord): { x: number; y: number } {
  const x = HEX_SIZE * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r);
  const y = HEX_SIZE * ((3 / 2) * coord.r);
  return { x, y };
}

// Convert pixel position to axial coordinates
export function pixelToHex(x: number, y: number): HexCoord {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / HEX_SIZE;
  const r = ((2 / 3) * y) / HEX_SIZE;
  return hexRound({ q, r });
}

// Round fractional hex coordinates to nearest hex
export function hexRound(coord: { q: number; r: number }): HexCoord {
  const s = -coord.q - coord.r;
  let rq = Math.round(coord.q);
  let rr = Math.round(coord.r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - coord.q);
  const rDiff = Math.abs(rr - coord.r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

// Get all 6 neighboring hex coordinates
export function getNeighbors(coord: HexCoord): HexCoord[] {
  const directions: HexCoord[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  return directions.map((d) => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

// Check if two hexes are neighbors
export function areNeighbors(a: HexCoord, b: HexCoord): boolean {
  const neighbors = getNeighbors(a);
  return neighbors.some((n) => n.q === b.q && n.r === b.r);
}

// Calculate distance between two hexes
export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

// Generate coordinates for a hex polygon (for SVG)
export function getHexPoints(centerX: number, centerY: number, size: number = HEX_SIZE): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top orientation
    const px = centerX + size * Math.cos(angle);
    const py = centerY + size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
}

// Generate all hex coordinates for a rectangular map
export function generateMapCoords(width: number, height: number): HexCoord[] {
  const coords: HexCoord[] = [];
  for (let r = 0; r < height; r++) {
    const rOffset = Math.floor(r / 2);
    for (let q = -rOffset; q < width - rOffset; q++) {
      coords.push({ q, r });
    }
  }
  return coords;
}

// Get map bounds in pixels
export function getMapBounds(width: number, height: number): { minX: number; minY: number; maxX: number; maxY: number } {
  const coords = generateMapCoords(width, height);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  coords.forEach((coord) => {
    const { x, y } = hexToPixel(coord);
    minX = Math.min(minX, x - HEX_SIZE);
    minY = Math.min(minY, y - HEX_SIZE);
    maxX = Math.max(maxX, x + HEX_SIZE);
    maxY = Math.max(maxY, y + HEX_SIZE);
  });
  
  return { minX, minY, maxX, maxY };
}

// Create a unique ID for a hex coordinate
export function coordToId(coord: HexCoord): string {
  return `hex_${coord.q}_${coord.r}`;
}

// Parse a hex ID back to coordinates
export function idToCoord(id: string): HexCoord {
  const parts = id.split('_');
  return { q: parseInt(parts[1]), r: parseInt(parts[2]) };
}
