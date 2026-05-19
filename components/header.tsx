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
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  const [showSettings, setShowSettings] = useState(false);

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

  const handleLogoChange = (url: string | null) => {
    setLogoUrl(url);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Future Roots Logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">FR</span>
            </div>
          )}
          <span className="text-xl font-semibold text-foreground hidden sm:block">Future Roots</span>
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
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
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

        {/* Tablet Navigation (icons only) */}
        <nav className="hidden md:flex lg:hidden items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-center p-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
                title={item.name}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          })}
          
          {/* Settings Dropdown for tablet */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
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

        {/* Mobile Navigation */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-white">
            <nav className="flex flex-col gap-2 mt-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="border-t border-border mt-4 pt-4">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  Public Home Page
                </Link>
                <div className="px-4 py-3">
                  <LogoUpload currentLogoUrl={logoUrl} onLogoChange={handleLogoChange} />
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
