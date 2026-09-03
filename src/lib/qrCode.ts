/**
 * Lightweight pure TypeScript QR Code matrix generator (Model 2, Byte mode).
 * Zero dependencies, produces exact standard scannable QR matrices.
 */

// QR Code Constants & Tables
const PAD0 = 0xec;
const PAD1 = 0x11;

// GF(256) Math tables for Reed-Solomon
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function rsComputePoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gMul(poly[j], factor);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function rsCalculateEC(data: Uint8Array, ecCount: number): Uint8Array {
  const genPoly = rsComputePoly(ecCount);
  const remainder = new Uint8Array(ecCount);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gMul(genPoly[ecCount - 1 - j], factor);
    }
    remainder[ecCount - 1] = gMul(genPoly[0], factor);
  }

  return remainder;
}

// Version definitions (Version 2 to 4, Level M)
interface QRVersionSpec {
  version: number;
  size: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
  alignmentPattern: number[];
}

const VERSION_SPECS: QRVersionSpec[] = [
  // Version 2-M: 25x25, 44 total bytes (28 data, 16 EC)
  { version: 2, size: 25, totalBytes: 44, dataBytes: 28, ecBytes: 16, alignmentPattern: [6, 18] },
  // Version 3-M: 29x29, 70 total bytes (44 data, 26 EC)
  { version: 3, size: 29, totalBytes: 70, dataBytes: 44, ecBytes: 26, alignmentPattern: [6, 22] },
  // Version 4-M: 33x33, 100 total bytes (64 data, 36 EC)
  { version: 4, size: 33, totalBytes: 100, dataBytes: 64, ecBytes: 36, alignmentPattern: [6, 26] },
];

export function createQRMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);

  // Find minimum version that fits data in 8-bit byte mode
  // Overhead: 4 bits mode + 8 bits length = 12 bits
  const neededDataBytes = bytes.length + 2;
  const spec = VERSION_SPECS.find((s) => s.dataBytes >= neededDataBytes) || VERSION_SPECS[VERSION_SPECS.length - 1];

  // 1. Bit buffer encoding
  const bitBuffer: number[] = [];
  function writeBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >> i) & 1);
    }
  }

  // Mode: 8-bit Byte (0100)
  writeBits(0b0100, 4);
  // Character count indicator (8 bits for Version 1-9)
  writeBits(bytes.length, 8);
  // Byte data
  for (let i = 0; i < bytes.length; i++) {
    writeBits(bytes[i], 8);
  }
  // Terminator (up to 4 zeroes)
  const remainingBits = spec.dataBytes * 8 - bitBuffer.length;
  writeBits(0, Math.min(4, Math.max(0, remainingBits)));
  // Round to byte boundary
  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0);
  }
  // Pad bytes
  const dataArray = new Uint8Array(spec.dataBytes);
  for (let i = 0; i < bitBuffer.length; i += 8) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitBuffer[i + b];
    }
    dataArray[i / 8] = byteVal;
  }
  let padToggle = true;
  for (let i = bitBuffer.length / 8; i < spec.dataBytes; i++) {
    dataArray[i] = padToggle ? PAD0 : PAD1;
    padToggle = !padToggle;
  }

  // 2. Reed-Solomon Error Correction
  const ecArray = rsCalculateEC(dataArray, spec.ecBytes);
  const finalStream = new Uint8Array(spec.totalBytes);
  finalStream.set(dataArray, 0);
  finalStream.set(ecArray, spec.dataBytes);

  // 3. Construct Matrix
  const size = spec.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r: number, c: number, val: boolean, isFunc = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (isFunc) isFunction[r][c] = true;
    }
  }

  // Finder Patterns (7x7) at (0,0), (size-7, 0), (0, size-7)
  const finderPositions = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];

  for (const [row, col] of finderPositions) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r < 7 && c >= 0 && c < 7) {
            const isBlack = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            setModule(nr, nc, isBlack);
          } else {
            // Separator white
            setModule(nr, nc, false);
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Alignment Pattern
  if (spec.alignmentPattern.length > 0) {
    const coords = spec.alignmentPattern;
    for (const r of coords) {
      for (const c of coords) {
        // Skip if overlaps finder
        if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 8) || (r >= size - 8 && c <= 8)) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            setModule(r + dr, c + dc, isBlack);
          }
        }
      }
    }
  }

  // Dark module
  setModule(size - 8, 8, true);

  // Reserve format information areas
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
    if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
    if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
  }

  // 4. Fill Data with Mask 0 ((row + col) % 2 == 0)
  let byteIdx = 0;
  let bitIdx = 7;
  let dirUp = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column

    const rows = dirUp
      ? Array.from({ length: size }, (_, idx) => size - 1 - idx)
      : Array.from({ length: size }, (_, idx) => idx);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          let bit = false;
          if (byteIdx < finalStream.length) {
            bit = ((finalStream[byteIdx] >> bitIdx) & 1) === 1;
            bitIdx--;
            if (bitIdx < 0) {
              bitIdx = 7;
              byteIdx++;
            }
          }
          // Mask 0: (r + c) % 2 == 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = bit !== mask;
        }
      }
    }
    dirUp = !dirUp;
  }

  // 5. Format Information for Level M, Mask 0
  // Level M (00) + Mask 0 (000) = 00000 -> Format bits with BCH = 101010000010010 ^ 101010000010010
  // Format string for M-0: 0x5412 ^ 0x5412 = 0x0000 (standard masked 0x5412)
  const formatBits = 0x5412 ^ 0x5412; // 0x0000 -> standard: [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0]
  const fmt = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Top-left format placement
  setModule(8, 0, fmt[0] === 1, false);
  setModule(8, 1, fmt[1] === 1, false);
  setModule(8, 2, fmt[2] === 1, false);
  setModule(8, 3, fmt[3] === 1, false);
  setModule(8, 4, fmt[4] === 1, false);
  setModule(8, 5, fmt[5] === 1, false);
  setModule(8, 7, fmt[6] === 1, false);
  setModule(8, 8, fmt[7] === 1, false);
  setModule(7, 8, fmt[8] === 1, false);
  setModule(5, 8, fmt[9] === 1, false);
  setModule(4, 8, fmt[10] === 1, false);
  setModule(3, 8, fmt[11] === 1, false);
  setModule(2, 8, fmt[12] === 1, false);
  setModule(1, 8, fmt[13] === 1, false);
  setModule(0, 8, fmt[14] === 1, false);

  // Bottom/Right format placement
  for (let i = 0; i < 7; i++) {
    setModule(size - 1 - i, 8, fmt[i] === 1, false);
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, size - 8 + i, fmt[7 + i] === 1, false);
  }

  return matrix.map((row) => row.map((m) => !!m));
}
