'use client';

import Link from 'next/link';
import { FaCircleCheck } from 'react-icons/fa6';

export default function RegistrationSuccessModal({ message }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-success-message"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#341D17]/35 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-sm rounded-3xl border border-[#82882B]/30 bg-[#FFFDF9] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#82882B]/15 text-[#65701F]">
          <FaCircleCheck className="h-6 w-6" />
        </div>
        <p
          id="registration-success-message"
          className="text-sm font-bold leading-relaxed text-[#341D17]"
        >
          {message}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex min-w-24 items-center justify-center rounded-xl bg-[#802924] px-5 py-2.5 text-sm font-bold text-[#FFFDF9] transition hover:bg-[#661F1B]"
        >
          OK
        </Link>
      </div>
    </div>
  );
}
