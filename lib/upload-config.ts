import { join } from 'path';

const isWin = process.platform === 'win32';

// Default base path
const DEFAULT_BASE_DIR = isWin
  ? 'C:\\Users\\Dmitry\\Desktop\\reality3d-uploads'
  : '/var/www/reality3d-uploads';

// Upload configuration
export const UPLOAD_CONFIG = {
  // Base directory from env or default
  baseDir: process.env.UPLOAD_DIR || DEFAULT_BASE_DIR,
  
  // Public files directory (subfolder of baseDir or separate env)
  publicDir: process.env.PUBLIC_UPLOAD_DIR || join(process.env.UPLOAD_DIR || DEFAULT_BASE_DIR, 'public'),
  
  // Limits
  maxFileSizePublic: 5 * 1024 * 1024, // 5MB
  maxFileSizePrivate: 50 * 1024 * 1024, // 50MB
  
  // Allowed extensions
  allowedPublicExtensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
  allowedPublicMime: new Set(['image/jpeg', 'image/png', 'image/webp']),
  allowedPrivateExtensions: new Set(['stl', 'obj', 'step', 'stp']),
};

export function isPathSafe(filename: string): boolean {
  if (!filename) return false;
  if (filename.includes('..')) return false;
  if (filename.includes('/') || filename.includes('\\')) return false;
  return true;
}
