import { redirect } from 'next/navigation';

export default async function TeacherCourseContentsRedirect({ params }) {
  const { id } = await params;
  redirect(`/dashboard/teacher/contents?courseId=${encodeURIComponent(id)}`);
}