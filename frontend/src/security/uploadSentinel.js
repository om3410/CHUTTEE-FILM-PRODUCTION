// UploadSentinel — validate file uploads before they leave the browser

const ALLOWED_EXT = [
  'pdf', 'doc', 'docx', 'txt', 'fdx', 'fountain',
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp4', 'mov', 'mkv', 'webm',
  'mp3', 'wav', 'm4a',
];

const MAX_SIZE_MB = 50;
const DANGEROUS_EXT = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'jar', 'scr', 'msi', 'dll', 'com', 'pif'];

export function validateFile(file) {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop();

  if (DANGEROUS_EXT.includes(ext)) {
    return { safe: false, reason: `Executable file type blocked: .${ext}` };
  }

  if (!ALLOWED_EXT.includes(ext)) {
    return { safe: false, reason: `File type not allowed: .${ext}` };
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { safe: false, reason: `File exceeds ${MAX_SIZE_MB}MB` };
  }

  // Check for double extensions (e.g. invoice.pdf.exe)
  const parts = name.split('.');
  if (parts.length > 2) {
    const innerExt = parts[parts.length - 2];
    if (DANGEROUS_EXT.includes(innerExt)) {
      return { safe: false, reason: 'Double extension detected' };
    }
  }

  // Check magic bytes for images
  return { safe: true, reason: null };
}

export async function validateFileMagic(file) {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const signatures = {
    jpg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47],
    gif: [0x47, 0x49, 0x46],
    pdf: [0x25, 0x50, 0x44, 0x46],
  };

  const ext = file.name.split('.').pop().toLowerCase();
  if (signatures[ext]) {
    const sig = signatures[ext];
    const matches = sig.every((b, i) => bytes[i] === b);
    if (!matches) {
      return { safe: false, reason: `File content does not match .${ext} extension` };
    }
  }

  return { safe: true };
}