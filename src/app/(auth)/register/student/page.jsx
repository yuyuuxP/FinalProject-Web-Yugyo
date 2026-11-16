import YugyoLandingPage from '@/app/page';
import RegisterStudentCard from '@/components/RegisterStudentCard';

export default function RegisterStudentPage() {
  return (
    <div className="relative min-h-screen bg-[#F9DDBB] overflow-hidden">
      <div
        aria-hidden="true"
        className="opacity-45 pointer-events-none select-none max-h-screen overflow-hidden"
      >
        <YugyoLandingPage />
      </div>

      <RegisterStudentCard />
    </div>
  );
}