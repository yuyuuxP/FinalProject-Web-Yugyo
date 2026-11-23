import YugyoLandingPage from '@/app/page';
import GuestHomepageCatalog from '@/app/(public)/courses/page';
import LoginModalContent from '@/components/LoginModalContent';

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const isFromCourses = resolvedSearchParams?.from === 'courses';

  return (
    <div className="relative min-h-screen bg-[#F9DDBB] overflow-hidden">
      
      {/* ================= LAYER BACKGROUND TRANSPARAN ================= */}
      <div
        aria-hidden="true"
        className="opacity-45 pointer-events-none select-none max-h-screen overflow-hidden"
      >
        {isFromCourses ? (
          <GuestHomepageCatalog searchParams={Promise.resolve({})} />
        ) : (
          <YugyoLandingPage />
        )}
      </div>

      {/* ================= LAYER FOREGROUND: MODAL LOGIN ================= */}
      <LoginModalContent backHref={isFromCourses ? '/courses' : '/'} />

    </div>
  );
}