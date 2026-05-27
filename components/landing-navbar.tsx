'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Menu, X, Bell, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { AuthModal } from './auth-modal';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface LandingNavbarProps {
  logoUrl: string | null;
}

export function LandingNavbar({ logoUrl }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle auth query parameter to auto-open modal
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'signin' || authParam === 'signup') {
      setAuthMode(authParam);
      setAuthModalOpen(true);
      // Clear the auth param from URL without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      url.searchParams.delete('redirect');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const openSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Team', href: '#team' },
    { name: 'Updates', href: '/announcements' },
  ];

  return (
    <>
      {/* Desktop Floating Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-4xl">
        <nav 
          className={`
            flex items-center justify-between
            px-4 sm:px-6 py-2.5
            rounded-full
            border
            transition-all duration-500 ease-out
            ${scrolled 
              ? 'bg-white/40 backdrop-blur-md border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.06)]' 
              : 'bg-white/20 backdrop-blur-sm border-white/20 shadow-[0_2px_16px_rgba(0,0,0,0.04)]'
            }
          `}
        >
          {/* Left - Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600/90 hover:text-gray-900 transition-all duration-300 hover:scale-[1.02]"
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
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                <span className="text-xs font-medium text-background">FR</span>
              </div>
            )}
            <span className="text-sm font-semibold text-gray-800 hidden sm:block">
              Future Roots
            </span>
          </Link>

          {/* Right - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoading && (
              user ? (
                <Link href="/dashboard">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#4f5b3a] text-white rounded-full text-sm font-medium transition-all duration-300 hover:bg-[#5a6844] hover:shadow-lg hover:shadow-[#4f5b3a]/20 hover:scale-[1.02]">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                </Link>
              ) : (
                <>
                  <button 
                    onClick={openSignIn}
                    className="text-sm font-medium text-gray-600/90 hover:text-gray-900 transition-all duration-300 hidden sm:block"
                  >
                    Sign in
                  </button>
                  <button 
                    onClick={openSignUp}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#4f5b3a] text-white rounded-full text-sm font-medium transition-all duration-300 hover:bg-[#5a6844] hover:shadow-lg hover:shadow-[#4f5b3a]/20 hover:scale-[1.02]"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Get Started</span>
                  </button>
                </>
              )
            )}
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
            {!isLoading && (
              user ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-[#4f5b3a] text-white rounded-full text-base font-medium transition-all duration-300 hover:bg-[#5a6844] hover:shadow-lg hover:shadow-[#4f5b3a]/20">
                    <LayoutDashboard className="h-5 w-5" />
                    Go to Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <button 
                    onClick={openSignUp}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-[#4f5b3a] text-white rounded-full text-base font-medium transition-all duration-300 hover:bg-[#5a6844] hover:shadow-lg hover:shadow-[#4f5b3a]/20"
                  >
                    <UserPlus className="h-5 w-5" />
                    Get Started
                  </button>
                  <button 
                    onClick={openSignIn}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-foreground/5 text-foreground rounded-full text-base font-medium transition-all duration-300 hover:bg-foreground/10"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign in
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultMode={authMode}
      />
    </>
  );
}
