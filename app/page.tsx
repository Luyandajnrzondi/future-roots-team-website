import { createClient } from '@/lib/supabase/server';
import { TeamMember, Announcement, HeroSlide } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, LayoutDashboard, Users, Smartphone, Sun, Tv, Mail, Phone, MapPin, Monitor, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LandingNavbar } from '@/components/landing-navbar';
import { HeroSlider } from '@/components/hero-slider';

export const dynamic = 'force-dynamic';

async function getLandingData() {
  const supabase = await createClient();
  
  const [membersRes, announcementsRes, settingsRes, heroSlidesRes] = await Promise.all([
    supabase.from('team_members').select('*').order('name'),
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('site_settings').select('*').eq('key', 'logo_url').single(),
    supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
  ]);

  return {
    members: (membersRes.data || []) as TeamMember[],
    announcements: (announcementsRes.data || []) as Announcement[],
    logoUrl: settingsRes.data?.value || null,
    heroSlides: (heroSlidesRes.data || []) as HeroSlide[],
  };
}

export default async function HomePage() {
  const { members, announcements, logoUrl, heroSlides } = await getLandingData();
  const displayedMembers = members.slice(0, 6);
  const hasMoreMembers = members.length > 6;

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar logoUrl={logoUrl} />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-muted/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <div className="text-center lg:text-left">
                <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-8">
                  A Team of {members.length} Dedicated Members
                </p>
                
                <h1 className="text-5xl md:text-7xl lg:text-6xl xl:text-7xl font-light text-foreground mb-8 tracking-tight text-balance leading-[1.1]">
                  Growing Together for a
                  <span className="block italic font-serif">Brighter Future</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed text-pretty">
                  Future Roots is a passionate team dedicated to creating sustainable solutions 
                  and empowering communities through collaboration and innovation.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="#team">
                    <button className="group inline-flex items-center gap-3 px-8 py-4 bg-foreground/80 backdrop-blur-sm text-background rounded-full text-sm font-medium transition-all duration-300 hover:bg-foreground/90 hover:gap-4">
                      Meet Our Team
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <button className="inline-flex items-center gap-3 px-8 py-4 border border-foreground/30 bg-background/50 backdrop-blur-sm text-foreground rounded-full text-sm font-medium transition-all duration-300 hover:bg-foreground/10">
                      <LayoutDashboard className="h-4 w-4" />
                      Team Dashboard
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right: Hero Slider */}
              {heroSlides.length > 0 && (
                <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
                  <HeroSlider 
                    slides={heroSlides} 
                    autoplayDelay={5000}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-32 bg-secondary/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Our Services
              </p>
              <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                What We Offer
              </h2>
              <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
                Professional services tailored to meet your technology and energy needs
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: Smartphone, 
                  title: 'Cellphone Repair', 
                  description: 'Expert repair services for all mobile devices. From screen replacements to software fixes, we restore your devices to perfect working condition.',
                  features: ['Screen Replacement', 'Battery Replacement', 'Software Repair', 'Water Damage Recovery']
                },
                { 
                  icon: Sun, 
                  title: 'Solar System Installation', 
                  description: 'Sustainable energy solutions for homes and businesses. Professional installation of solar panels and complete energy systems.',
                  features: ['Panel Installation', 'System Design', 'Maintenance', 'Energy Consultation']
                },
                { 
                  icon: Tv, 
                  title: 'Digital Migration', 
                  description: 'Seamless transition to digital broadcasting. We help you upgrade your entertainment systems for the digital age.',
                  features: ['Decoder Setup', 'Antenna Installation', 'Signal Optimization', 'Technical Support']
                },
                { 
                  icon: Monitor, 
                  title: 'Hardware Installation', 
                  description: 'Professional setup and installation of computer hardware and networking equipment for homes and offices.',
                  features: ['Computer Setup', 'Network Installation', 'Peripheral Configuration', 'System Upgrades']
                },
                { 
                  icon: Briefcase, 
                  title: 'Business Clinic', 
                  description: 'Strategic business consulting and support services to help entrepreneurs and small businesses grow and succeed.',
                  features: ['Business Planning', 'Financial Guidance', 'Marketing Strategy', 'Growth Consultation']
                },
              ].map((service, index) => (
                <div 
                  key={index} 
                  className="group relative p-10 bg-card/60 backdrop-blur-sm rounded-3xl border border-border/50 hover:bg-card transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6 group-hover:bg-foreground/10 transition-colors">
                      <service.icon className="h-7 w-7 text-foreground" />
                    </div>
                    
                    <h3 className="text-2xl font-medium text-foreground mb-4">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{service.description}</p>
                    
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                  About Us
                </p>
                <h2 className="text-4xl md:text-5xl font-light text-foreground mb-8 tracking-tight">
                  Who We Are
                </h2>
              </div>
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Future Roots is a collaborative initiative bringing together {members.length} dedicated individuals 
                  who share a common vision for positive change. Our team combines diverse skills, backgrounds, 
                  and perspectives to tackle challenges and create meaningful impact in our communities.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We believe that sustainable progress comes from working together, learning from each other, 
                  and staying committed to our shared values.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-32 bg-secondary/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Our Mission
              </p>
              <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                What We Stand For
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Sustainable Growth', description: 'Building eco-friendly solutions that nurture communities and the environment.' },
                { title: 'Community Power', description: 'Creating opportunities for local communities to thrive through education.' },
                { title: 'Innovation', description: 'Developing innovative approaches to address challenges effectively.' },
                { title: 'Inclusivity', description: 'Ensuring our initiatives are accessible and beneficial to all members.' },
              ].map((value, index) => (
                <div 
                  key={index} 
                  className="group p-8 bg-card/60 backdrop-blur-sm rounded-3xl border border-border/50 hover:bg-card transition-all duration-500"
                >
                  <span className="text-sm text-muted-foreground font-medium">0{index + 1}</span>
                  <h3 className="text-xl font-medium text-foreground mt-4 mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="py-32 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
              <div>
                <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                  Our Team
                </p>
                <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                  Meet the People Behind
                  <span className="block italic font-serif">Future Roots</span>
                </h2>
              </div>
              {hasMoreMembers && (
                <Link href="/dashboard">
                  <button className="group inline-flex items-center gap-3 px-6 py-3 bg-foreground/80 backdrop-blur-sm text-background rounded-full text-sm font-medium transition-all duration-300 hover:bg-foreground/90 hover:gap-4">
                    <Users className="h-4 w-4" />
                    View All {members.length} Members
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {displayedMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="group text-center"
                >
                  <div className="relative mb-4 overflow-hidden rounded-2xl bg-muted/50 aspect-square">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-light text-muted-foreground">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-foreground text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{member.position}</p>
                </div>
              ))}
            </div>

            {hasMoreMembers && (
              <div className="text-center mt-12 md:hidden">
                <Link href="/dashboard">
                  <button className="group inline-flex items-center gap-3 px-6 py-3 bg-foreground/80 backdrop-blur-sm text-background rounded-full text-sm font-medium transition-all duration-300 hover:bg-foreground/90">
                    <Users className="h-4 w-4" />
                    View All {members.length} Members
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <section className="py-32 bg-secondary/50">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
                <div>
                  <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                    Latest Updates
                  </p>
                  <h2 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                    Stay Informed
                  </h2>
                </div>
                <Link href="/announcements">
                  <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    View All Updates
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {announcements.map((announcement) => (
                  <article 
                    key={announcement.id} 
                    className="group p-8 bg-card/60 backdrop-blur-sm rounded-3xl border border-border/50 hover:bg-card transition-all duration-500"
                  >
                    <time className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </time>
                    <h3 className="text-lg font-medium text-foreground mt-3 mb-2">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {announcement.content}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-32 border-t border-border">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Part of the Team?
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-8 tracking-tight">
              Access Your Dashboard
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              View schedules, track attendance, manage files, and stay updated with the latest announcements.
            </p>
            <Link href="/dashboard">
              <button className="group inline-flex items-center gap-3 px-10 py-5 bg-foreground/80 backdrop-blur-sm text-background rounded-full text-base font-medium transition-all duration-300 hover:bg-foreground/90 hover:gap-4">
                <LayoutDashboard className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background">
        {/* Main Footer */}
        <div className="py-20 border-b border-background/10">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Future Roots Logo"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl object-contain bg-background/10 p-1"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background">
                      <span className="text-lg font-medium text-foreground">FR</span>
                    </div>
                  )}
                  <span className="text-xl font-medium text-background">Future Roots</span>
                </div>
                <p className="text-background/70 leading-relaxed max-w-md mb-8">
                  Building a sustainable future through technology and community empowerment. 
                  We provide professional services including cellphone repair, solar installations, 
                  digital migration, hardware installation, and business consulting to help our community thrive.
                </p>
                <div className="flex gap-4">
                  <a 
                    href="#" 
                    className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-medium text-background mb-6">Quick Links</h3>
                <ul className="space-y-4">
                  <li>
                    <Link href="#services" className="text-background/70 hover:text-background transition-colors">
                      Our Services
                    </Link>
                  </li>
                  <li>
                    <Link href="#about" className="text-background/70 hover:text-background transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="#team" className="text-background/70 hover:text-background transition-colors">
                      Meet the Team
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="text-background/70 hover:text-background transition-colors">
                      Team Dashboard
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-medium text-background mb-6">Contact Us</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-background/50 shrink-0 mt-0.5" />
                    <span className="text-background/70">
                      49 Sbonakaliso Mchunu St<br />
                      Community Church<br />
                      South Africa
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-background/50 shrink-0" />
                    <a href="tel:+27123456789" className="text-background/70 hover:text-background transition-colors">
                      +27 63 362 2772
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-background/50 shrink-0" />
                    <a href="mailto:info@futureroots.co.za" className="text-background/70 hover:text-background transition-colors">
                      info@futureroots.co.za
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Services Bar */}
        <div className="py-8 border-b border-background/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2 text-background/60">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">Cellphone Repair</span>
              </div>
              <div className="flex items-center gap-2 text-background/60">
                <Sun className="h-4 w-4" />
                <span className="text-sm">Solar Installation</span>
              </div>
              <div className="flex items-center gap-2 text-background/60">
                <Tv className="h-4 w-4" />
                <span className="text-sm">Digital Migration</span>
              </div>
              <div className="flex items-center gap-2 text-background/60">
                <Monitor className="h-4 w-4" />
                <span className="text-sm">Hardware Installation</span>
              </div>
              <div className="flex items-center gap-2 text-background/60">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm">Business Clinic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-background/50">
                &copy; {new Date().getFullYear()} Future Roots. All rights reserved.
              </p>
              <p className="text-sm text-background/50">
                Building a sustainable future, together.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
