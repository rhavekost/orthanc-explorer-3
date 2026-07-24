/**
 * Client-side DICOM file validation.
 *
 * DICOM Part 10 files have a fixed preamble: 128 zero bytes followed by
 * the 4-byte magic string "DICM". Checking this is more reliable than
 * file extension or MIME type (browsers assign "application/octet-stream"
 * to most DICOM files regardless of the IANA type "application/dicom").
 *
 * Reference: DICOM PS3.10 §7.1 — File Meta Information
 */

const DICOM_MAGIC_OFFSET = 128;
const DICOM_MAGIC = [0x44, 0x49, 0x43, 0x4d] as const; // "DICM"
const PEEK_SIZE = DICOM_MAGIC_OFFSET + DICOM_MAGIC.length; // 132 bytes

/**
 * Reads the first 132 bytes of a file and checks for the DICOM preamble.
 * Returns false for files smaller than 132 bytes (no valid DICOM file is
 * that small).
 */
export async function hasDicomMagicBytes(file: File): Promise<boolean> {
  if (file.size < PEEK_SIZE) return false;
  const buffer = await readBlobArrayBuffer(file.slice(0, PEEK_SIZE));
  const bytes = new Uint8Array(buffer);
  return DICOM_MAGIC.every((byte, i) => bytes[DICOM_MAGIC_OFFSET + i] === byte);
}

function readBlobArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error('Failed to read DICOM header.'));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read DICOM header.'));
    };

    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Fast synchronous check: returns true for files that are definitely not
 * DICOM based on their name alone. Used as a pre-filter before the async
 * magic-byte check to avoid queuing obviously invalid files.
 *
 * Does NOT reject files with no extension — many DICOM files from scanners
 * have no extension and those must pass through to the magic-byte check.
 */
export function isKnownNonDicom(file: File): boolean {
  const name = file.name;

  // Hidden / OS metadata files (e.g. .DS_Store, .localized, .Spotlight-V100)
  if (name.startsWith('.')) return true;

  // Windows thumbnail cache
  if (name.toLowerCase() === 'thumbs.db') return true;

  // Reject by known non-DICOM file extension
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  const nonDicomExtensions = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'svg', 'ico',
    'pdf', 'txt', 'csv', 'xml', 'json', 'html', 'htm', 'css', 'js', 'ts',
    'zip', 'tar', 'gz', 'bz2', '7z', 'rar',
    'db', 'sqlite', 'ini', 'cfg', 'conf', 'log', 'md',
    'mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav',
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'exe', 'dll', 'dmg', 'pkg', 'deb', 'rpm',
  ]);

  return ext !== '' && nonDicomExtensions.has(ext);
}
