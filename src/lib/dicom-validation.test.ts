import { describe, it, expect } from 'vitest';
import { hasDicomMagicBytes, isKnownNonDicom } from './dicom-validation';

describe('hasDicomMagicBytes', () => {
  it('returns true when DICOM magic bytes are present at offset 128', async () => {
    const bytes = new Uint8Array(132);
    bytes[128] = 0x44;
    bytes[129] = 0x49;
    bytes[130] = 0x43;
    bytes[131] = 0x4d;

    await expect(hasDicomMagicBytes(new File([bytes], 'scan'))).resolves.toBe(true);
  });

  it('returns false for files smaller than 132 bytes', async () => {
    await expect(hasDicomMagicBytes(new File([new Uint8Array(10)], 'tiny'))).resolves.toBe(false);
  });

  it('returns false when DICOM magic bytes are absent', async () => {
    await expect(hasDicomMagicBytes(new File([new Uint8Array(132)], 'scan'))).resolves.toBe(false);
  });
});

describe('isKnownNonDicom', () => {
  it('returns true for dotfiles', () => {
    expect(isKnownNonDicom(new File([], '.DS_Store'))).toBe(true);
  });

  it('returns true for thumbs.db case-insensitively', () => {
    expect(isKnownNonDicom(new File([], 'Thumbs.db'))).toBe(true);
  });

  it('returns true for known non-DICOM extensions', () => {
    expect(isKnownNonDicom(new File([], 'image.png'))).toBe(true);
  });

  it('returns false for names with no extension', () => {
    expect(isKnownNonDicom(new File([], 'IM000001'))).toBe(false);
  });

  it('returns false for unlisted extensions', () => {
    expect(isKnownNonDicom(new File([], 'series.dcm'))).toBe(false);
  });
});
