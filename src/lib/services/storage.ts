import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function saveScreenshot(file: File): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    if (!file || file.size === 0) {
      return { success: false, error: 'No file provided.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds the 5MB limit.' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Simple magic number check for added security (Server-side validation)
    const magicNumbers = buffer.toString('hex', 0, 4).toUpperCase();
    const isJPEG = magicNumbers.startsWith('FFD8FF');
    const isPNG = magicNumbers === '89504E47';
    const isWEBP = magicNumbers === '52494646' && buffer.toString('hex', 8, 12).toUpperCase() === '57454250';

    if (!isJPEG && !isPNG && !isWEBP) {
      return { success: false, error: 'Invalid file content. Must be a valid image.' };
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const filename = `DON-${uuidv4()}.${ext}`;

    const uploadsDir = join(process.cwd(), 'storage', 'uploads', 'donations');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error saving screenshot:', error);
    return { success: false, error: 'Failed to save screenshot.' };
  }
}
