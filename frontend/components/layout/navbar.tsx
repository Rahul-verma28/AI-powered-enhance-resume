'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth, UserButton } from '@clerk/nextjs';
import {
  FileText,
  LayoutDashboard,
  History,
  Mail,
  Briefcase,
  Sparkles,
  Moon,
  Sun,
  Menu,
  X,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tailor', label: 'Tailor Resume', icon: Sparkles },
  { href: '/history', label: 'History', icon: History },
  { href: '/cover-letter', label: 'Cover Letter', icon: Mail },
  { href: '/jobs', label: 'Job Tracker', icon: Briefcase },
];

export function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { isSignedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Resume<span className="text-blue-600 dark:text-blue-400">AI</span>
            </span>
          </Link>

          {/* Desktop Nav — only show when signed in */}
          {isSignedIn && (
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Auth buttons */}
            {!isSignedIn ? (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" /> Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && isSignedIn && (
        <div className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm md:hidden">
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all',
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
