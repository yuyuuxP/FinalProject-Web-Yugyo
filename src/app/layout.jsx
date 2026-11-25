import { Meddon, Homemade_Apple } from 'next/font/google';
import './globals.css';

const meddon = Meddon({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-meddon',
  display: 'swap',
});

const homemadeApple = Homemade_Apple({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-homemade-apple',
  display: 'swap',
});

export const metadata = {
  title: 'Yugyo - Online Education Platform',
  description: 'Platform Pembelajaran Interaktif & Manajemen Kursus',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${meddon.variable} ${homemadeApple.variable}`}>
      <body className="bg-[var(--color-light-silver)] text-[var(--color-prussian)] antialiased">
        {children}
      </body>
    </html>
  );
}