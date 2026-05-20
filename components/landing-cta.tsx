'use client'

import { useState } from 'react'
import { ArrowRight, LayoutDashboard } from 'lucide-react'
import { AuthModal } from './auth-modal'

export function LandingCTA() {
  const [authModalOpen, setAuthModalOpen] = useState(false)

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
