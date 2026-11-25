import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  getInstructorPortfolioExtension,
  validateInstructorPortfolioFile,
} from '@/lib/instructorPortfolioValidation';

const PORTFOLIO_DIRECTORY = path.join(
  process.cwd(),
  '.private_uploads',
  'instructor-portfolios'
);
const STORED_FILE_PATTERN =
  /^[a-f0-9]{32}\.(pdf|doc|docx|jpg|jpeg|png)$/i;

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

export async function saveInstructorPortfolio(file) {
  const validationError = validateInstructorPortfolioFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const extension = getInstructorPortfolioExtension(file.name);
  const storedFileName = `${crypto.randomBytes(16).toString('hex')}${extension}`;
  const originalFileName = path
    .basename(String(file.name || '').replace(/\\/g, '/'))
    .replace(/[\r\n]/g, '')
    .slice(0, 200);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.length !== file.size) {
    throw new Error('Ukuran file CV atau portofolio tidak sesuai.');
  }

  await fs.mkdir(PORTFOLIO_DIRECTORY, { recursive: true });
  const filePath = path.join(PORTFOLIO_DIRECTORY, storedFileName);
  try {
    await fs.writeFile(filePath, bytes, { flag: 'wx' });
  } catch (error) {
    if (error?.code !== 'EEXIST') {
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        if (cleanupError?.code !== 'ENOENT') {
          console.error('Failed to clean up incomplete instructor portfolio:', cleanupError);
        }
      }
    }
    throw error;
  }

  return {
    filePath: storedFileName,
    fileName: originalFileName || `portfolio${extension}`,
  };
}

export async function deleteInstructorPortfolio(storedFileName) {
  const filePath = resolveInstructorPortfolioPath(storedFileName);
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

export function resolveInstructorPortfolioPath(storedFileName) {
  if (
    typeof storedFileName !== 'string' ||
    !STORED_FILE_PATTERN.test(storedFileName)
  ) {
    return null;
  }

  return path.join(PORTFOLIO_DIRECTORY, storedFileName);
}

export function getInstructorPortfolioMimeType(storedFileName) {
  const extension = path.extname(String(storedFileName || '')).toLowerCase();
  return MIME_TYPES[extension] || 'application/octet-stream';
}
