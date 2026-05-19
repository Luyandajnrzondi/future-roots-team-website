'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Calendar, 
  Upload, 
  LayoutDashboard, 
  Clock, 
  CalendarDays, 
  Wallet,
  Menu,
  Bell,
  Home,
  Settings,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogoUpload } from '@/components/logo-upload';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Timetable', href: '/timetable', icon: Clock },
  { name: 'Meetings', href: '/meetings', icon: CalendarDays },
  { name: 'Finances', href: '/finances', icon: Wallet },
  { name: 'Uploads', href: '/uploads', icon: Upload },
  { name: 'Announcements', href: '/announcements', icon: Bell },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();
      
      if (data?.value) {
        setLogoUrl(data.value);
      }
    };
    
    fetchLogo();
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogoChange = (url: string | null) => {
    setLogoUrl(url);
  };

  return (
    <>
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white/70 backdrop-blur-xl rounded-full border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
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
            <span className="text-sm font-semibold text-foreground hidden sm:block">Future Roots</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <Home className="h-4 w-4" />
                    Public Home Page
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <LogoUpload currentLogoUrl={logoUrl} onLogoChange={handleLogoChange} />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tablet Navigation (icons only) */}
          <nav className="hidden md:flex lg:hidden items-center gap-1">
            {navigation.slice(0, 6).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-full transition-all duration-300',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  )}
                  title={item.name}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              );
            })}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <Home className="h-4 w-4" />
                    Public Home Page
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <LogoUpload currentLogoUrl={logoUrl} onLogoChange={handleLogoChange} />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-foreground hover:bg-foreground/5 rounded-full transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24" />

      {/* Mobile Menu Overlay */}
      <div 
        className={`
          fixed inset-0 z-50 md:hidden
          transition-opacity duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        
        {/* Menu Panel */}
        <div 
          className={`
            absolute top-4 left-4 right-4
            bg-white/70 backdrop-blur-xl
            rounded-3xl
            border border-white/40
            shadow-2xl
            max-h-[calc(100vh-2rem)]
            overflow-y-auto
            transition-all duration-500 ease-out
            ${mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/30 sticky top-0 bg-white/70 backdrop-blur-xl rounded-t-3xl">
            <button
              onClick={() => setMobileOpen(false)}
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
              href="/"
              onClick={() => setMobileOpen(false)}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
              aria-label="Home"
            >
              <Home className="h-5 w-5" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="p-4 pt-0 border-t border-border/30 mt-2">
            <p className="text-xs text-muted-foreground px-4 py-2">Settings</p>
            <div className="px-4 py-3">
              <LogoUpload currentLogoUrl={logoUrl} onLogoChange={handleLogoChange} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
