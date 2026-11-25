import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '@/lib/db';
import {
  getInstructorPortfolioMimeType,
  resolveInstructorPortfolioPath,
} from '@/lib/instructorPortfolioStorage';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const teacherId = Number(id);
    if (
      !/^\d+$/.test(String(id || '')) ||
      !Number.isSafeInteger(teacherId) ||
      teacherId <= 0
    ) {
      return NextResponse.json(
        { message: 'ID instruktur tidak valid.' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const adminId = Number(cookieStore.get('yugyo_user_id')?.value || 0);
    if (!Number.isInteger(adminId) || adminId <= 0) {
      return NextResponse.json(
        { message: 'Sesi admin tidak ditemukan.' },
        { status: 401 }
      );
    }

    const adminResult = await pool.query(
      'SELECT role FROM users WHERE id = $1 LIMIT 1;',
      [adminId]
    );
    if (String(adminResult.rows[0]?.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json(
        { message: 'Akses hanya tersedia untuk admin.' },
        { status: 403 }
      );
    }

    const teacherResult = await pool.query(
      `SELECT portfolio_file_path, portfolio_file_name
       FROM users
       WHERE id = $1 AND LOWER(COALESCE(role, '')) = 'teacher'
       LIMIT 1;`,
      [teacherId]
    );
    const teacher = teacherResult.rows[0];
    if (!teacher?.portfolio_file_path) {
      return NextResponse.json(
        { message: 'File CV atau portofolio tidak ditemukan.' },
        { status: 404 }
      );
    }

    const filePath = resolveInstructorPortfolioPath(
      teacher.portfolio_file_path
    );
    if (!filePath) {
      return NextResponse.json(
        { message: 'Referensi file CV atau portofolio tidak valid.' },
        { status: 404 }
      );
    }

    let fileBytes;
    try {
      fileBytes = await fs.readFile(filePath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return NextResponse.json(
          { message: 'File CV atau portofolio tidak ditemukan di penyimpanan.' },
          { status: 404 }
        );
      }
      throw error;
    }

    const extension = path.extname(teacher.portfolio_file_path);
    const downloadName = String(
      teacher.portfolio_file_name || `portfolio${extension}`
    )
      .replace(/[\\/"\r\n]/g, '_')
      .slice(0, 200);
    const asciiName = downloadName.replace(/[^\x20-\x7E]/g, '_');

    return new NextResponse(new Uint8Array(fileBytes), {
      status: 200,
      headers: {
        'Content-Type': getInstructorPortfolioMimeType(
          teacher.portfolio_file_path
        ),
        'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('GET admin instructor portfolio error:', error);
    return NextResponse.json(
      { message: 'Gagal mengambil file CV atau portofolio.' },
      { status: 500 }
    );
  }
}
