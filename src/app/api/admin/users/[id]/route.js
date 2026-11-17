import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST / PUT: Mengubah data user berdasarkan ID
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    
    const full_name = formData.get('full_name');
    const email = formData.get('email');
    const password = formData.get('password');
    const role = formData.get('role');
    const status = formData.get('status') || 'active';
    const specialty = formData.get('specialty');

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Nama dan email wajib diisi' }, { status: 400 });
    }

    if (password && password.trim() !== '') {
      await pool.query(
        `UPDATE users 
         SET full_name = $1, email = $2, password = crypt($3, gen_salt('bf')), role = $4, status = $5, specialty = $6 
         WHERE id = $7;`,
        [full_name, email, password, role, status, specialty, id]
      );
    } else {
      await pool.query(
        `UPDATE users 
         SET full_name = $1, email = $2, role = $3, status = $4, specialty = $5 
         WHERE id = $6;`,
        [full_name, email, role, status, specialty, id]
      );
    }

    return NextResponse.redirect(new URL('/dashboard/admin/users', request.url), 303);
  } catch (err) {
    console.error('API Update User Error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 });
  }
}

// DELETE: Menghapus pengguna berdasarkan ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await pool.query('DELETE FROM users WHERE id = $1;', [id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('API Delete User Error:', err);
    return NextResponse.json({ error: 'Gagal menghapus pengguna dari database' }, { status: 500 });
  }
}