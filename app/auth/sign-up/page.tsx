'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// This page redirects to the homepage with auth popup
// The actual sign-up happens through the AuthModal in LandingNavbar
export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/?auth=signup')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Redirecting to sign up...</p>
      </div>
    </div>
  )
}
