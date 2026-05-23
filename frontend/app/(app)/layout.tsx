import { Navbar } from '@/components/layout/navbar';
import { AuthSync } from '@/components/auth-sync';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthSync>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </AuthSync>
  );
}
