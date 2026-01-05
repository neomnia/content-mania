"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Appointments page - redirects to Calendar
 * The calendar page now handles both calendar view and appointments list
 */
export default function AppointmentsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/calendar")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting to Calendar...</p>
      </div>
    </div>
  )
}
