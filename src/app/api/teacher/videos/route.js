import { NextResponse } from 'next/server';
import {
  scanAllCategoryVideos,
  findMatchedVideosForCourse,
} from '@/lib/mediaMatcher';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseTitle = searchParams.get('courseTitle') || '';
    const categoryName = (searchParams.get('category') || '').toLowerCase();

    const allFolderFiles = await scanAllCategoryVideos();
    const matchedFiles = courseTitle
      ? await findMatchedVideosForCourse(courseTitle, allFolderFiles, categoryName)
      : [];

    return NextResponse.json({
      success: true,
      courseTitle,
      matchedVideos: matchedFiles.length > 0 ? matchedFiles : allFolderFiles.slice(0, 5),
      totalMatched: matchedFiles.length,
    });
  } catch (error) {
    console.error('Error scanning public/videos:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membaca folder video pembelajaran.' },
      { status: 500 }
    );
  }
}