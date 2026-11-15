import './globals.css';

export const metadata = {
  title: 'Yugyo - Online Education Platform',
  description: 'Platform Pembelajaran Interaktif & Manajemen Kursus',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-[var(--color-light-silver)] text-[var(--color-prussian)] antialiased">
        {children}
      </body>
    </html>
  );
}