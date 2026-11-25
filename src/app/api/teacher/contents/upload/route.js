import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireActiveTeacher } from '@/lib/teacher-access';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'videos', 'upload');
const ALLOWED_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);

function sanitizeFileName(rawName) {
  const base = path.basename(String(rawName || 'video.mp4'));
  const ext = path.extname(base).toLowerCase() || '.mp4';
  const stem = base
    .slice(0, base.length - path.extname(base).length)
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'video_materi';
  const safeExt = ALLOWED_EXTS.has(ext) ? ext : '.mp4';
  return `${Date.now()}_${stem}${safeExt}`;
}

export async function POST(request) {
  try {
    const access = await requireActiveTeacher();
    if (access.response) return access.response;

    const formData = await request.formData();
    const file = formData.get('file') || formData.get('video');

    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json(
        { success: false, message: 'File video tidak ditemukan.' },
        { status: 400 }
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const fileName = sanitizeFileName(file.name);
    const targetPath = path.join(UPLOAD_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(targetPath, buffer);

    return NextResponse.json(
      {
        success: true,
        fileName,
        video_url: `/videos/upload/${fileName}`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error uploading video:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal mengupload video ke server.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const access = await requireActiveTeacher();
    if (access.response) return access.response;

    const { searchParams } = new URL(request.url);
    const rawFile = searchParams.get('file') || searchParams.get('url') || '';
    const fileName = path.basename(String(rawFile).trim());

    if (!fileName || fileName === '.' || fileName === '..') {
      return NextResponse.json(
        { success: false, message: 'Nama file tidak valid.' },
        { status: 400 }
      );
    }

    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    const targetPath = path.resolve(resolvedUploadDir, fileName);

    if (!targetPath.startsWith(resolvedUploadDir + path.sep)) {
      return NextResponse.json(
        { success: false, message: 'Akses path ditolak.' },
        { status: 403 }
      );
    }

    await fs.unlink(targetPath).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'File video terupload berhasil dihapus.',
    });
  } catch (err) {
    console.error('Error deleting uploaded video:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus file video.' },
      { status: 500 }
    );
  }
}