export const MAX_INSTRUCTOR_PORTFOLIO_SIZE = 10 * 1024 * 1024;
export const INSTRUCTOR_PORTFOLIO_ACCEPT =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png';

const MIME_TYPES_BY_EXTENSION = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
  ],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
};

export function getInstructorPortfolioExtension(fileName = '') {
  const match = String(fileName).toLowerCase().match(/\.[^.]+$/);
  return match?.[0] || '';
}

export function validateInstructorPortfolioFile(file) {
  if (!file) return '';
  if (typeof file.size !== 'number' || file.size <= 0) {
    return 'File CV atau portofolio tidak boleh kosong.';
  }
  if (file.size > MAX_INSTRUCTOR_PORTFOLIO_SIZE) {
    return 'Ukuran file maksimal 10 MB.';
  }

  const extension = getInstructorPortfolioExtension(file.name);
  const allowedMimeTypes = MIME_TYPES_BY_EXTENSION[extension];
  if (!allowedMimeTypes) {
    return 'Format file harus PDF, DOC, DOCX, JPG, JPEG, atau PNG.';
  }

  const mimeType = String(file.type || '').toLowerCase();
  if (
    mimeType &&
    mimeType !== 'application/octet-stream' &&
    !allowedMimeTypes.includes(mimeType)
  ) {
    return 'Tipe file tidak sesuai dengan ekstensi file.';
  }

  return '';
}
