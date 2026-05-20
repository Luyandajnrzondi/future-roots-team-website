'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, Bell, LogIn } from 'lucide-react';

interface LandingNavbarProps {
  logoUrl: string | null;
}

export function LandingNavbar({ logoUrl }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Team', href: '#team' },
    { name: 'Updates', href: '/announcements' },
  ];

  return (
    <>
      {/* Desktop Floating Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-5xl">
        <nav 
          className={`
            flex items-center justify-between
            px-4 sm:px-8 py-4
            bg-white/90 backdrop-blur-xl
            rounded-full
            border border-gray-200/50
            shadow-[0_8px_32px_rgba(0,0,0,0.08)]
            transition-all duration-500
            ${scrolled ? 'bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]' : ''}
          `}
        >
          {/* Left - Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-300"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button - Left on mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Center - Logo */}
          <Link 
            href="/" 
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Future Roots Logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground">
                <span className="text-sm font-medium text-background">FR</span>
              </div>
            )}
            <span className="text-base font-semibold text-gray-900 hidden sm:block">
              Future Roots
            </span>
          </Link>

          {/* Right - Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/auth/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-300 hidden sm:block"
            >
              Sign in
            </Link>
            <Link href="/auth/login">
              <button className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium transition-all duration-300 hover:bg-gray-800">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Get Started</span>
              </button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`
          fixed inset-0 z-50 md:hidden
          transition-opacity duration-300
          ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div 
          className={`
            absolute top-4 left-4 right-4
            bg-white/70 backdrop-blur-xl
            rounded-3xl
            border border-white/40
            shadow-2xl
            transition-all duration-500 ease-out
            ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/30">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -ml-2 text-foreground hover:bg-foreground/5 rounded-full transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Future Roots Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-contain"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                  <span className="text-xs font-medium text-background">FR</span>
                </div>
              )}
            </Link>

            <Link 
              href="/announcements"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
              aria-label="Announcements"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-4 text-2xl font-light text-foreground hover:text-muted-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="p-6 pt-0 space-y-3">
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-foreground/80 backdrop-blur-sm text-background rounded-full text-base font-medium transition-all duration-300 hover:bg-foreground/90">
                <LogIn className="h-5 w-5" />
                Sign in
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
