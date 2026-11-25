import LoginModalContent from '@/components/LoginModalContent';

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const isFromCourses = resolvedSearchParams?.from === 'courses';

  return (
    <main className="fixed inset-0 h-dvh overflow-hidden bg-[#F9DDBB]">
      <LoginModalContent backHref={isFromCourses ? '/courses' : '/'} />
    </main>
  );
}