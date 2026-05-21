'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, LayoutDashboard } from 'lucide-react'
import { AuthModal } from './auth-modal'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

export function LandingCTA() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Don't show the CTA section if user is logged in
  if (!isLoading && user) {
    return (
      <section className="py-32 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Welcome Back
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-8 tracking-tight">
            Access Your Dashboard
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            View schedules, track attendance, manage files, and stay updated with the latest announcements.
          </p>
          <Link href="/dashboard">
            <button className="group inline-flex items-center gap-3 px-10 py-5 bg-olive text-olive-foreground rounded-full text-base font-medium transition-all duration-300 hover:bg-olive/90 hover:gap-4 hover:shadow-lg hover:shadow-olive/25">
              <LayoutDashboard className="h-5 w-5" />
              Go to Dashboard
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
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
          <button 
            onClick={() => setAuthModalOpen(true)}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-olive text-olive-foreground rounded-full text-base font-medium transition-all duration-300 hover:bg-olive/90 hover:gap-4 hover:shadow-lg hover:shadow-olive/25"
          >
            <LayoutDashboard className="h-5 w-5" />
            Sign in to Dashboard
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultMode="signin"
      />
    </>
  )
}
