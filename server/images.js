import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import sharp from 'sharp';

/**
 * Student photo uploads.
 *
 * Files are received in memory (small, capped at 5 MB), then optimized with
 * sharp: resized to a sensible max edge, re-encoded to WebP, and stripped of
 * metadata. We write to `public/uploads/students/` so the same root-relative
 * URL resolves in dev (Vite serves `public/`) and prod (Node serves the dir).
 */

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 1024;

/** multer instance: memory storage, image-only, size-capped. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(Object.assign(new Error('Only image files are allowed'), { status: 400 }));
  },
});

/**
 * Optimize a raw image buffer and persist it.
 * @param {Buffer} buffer
 * @param {string} uploadsDir absolute path to public/uploads/students
 * @returns {Promise<{ url: string, filename: string }>} root-relative URL
 */
export async function saveOptimizedImage(buffer, uploadsDir) {
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  const dest = path.join(uploadsDir, filename);
  await sharp(buffer)
    .rotate() // respect EXIF orientation before stripping metadata
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(dest);
  return { url: `/uploads/students/${filename}`, filename };
}
