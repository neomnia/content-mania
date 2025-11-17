import { ErrorPageLayout } from '@/components/error-page-layout'

export default function MaintenancePage() {
  return (
    <ErrorPageLayout
      errorCode="MAINTENANCE"
      title="Site Under Maintenance"
      description="Our site is currently undergoing scheduled maintenance. We will be back shortly. Thank you for your patience."
      icon={
        <div className="flex items-center justify-center">
          <svg className="h-40 w-40 sm:h-56 sm:w-56" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="90" className="fill-[#5B8FF9] opacity-20" />
            <g className="animate-spin" style={{ transformOrigin: '100px 100px' }}>
              <path d="M100 40 L110 50 L100 60 L90 50 Z M160 100 L150 110 L140 100 L150 90 Z M100 160 L90 150 L100 140 L110 150 Z M40 100 L50 90 L60 100 L50 110 Z" className="fill-[#5B8FF9]" />
              <circle cx="100" cy="100" r="35" className="fill-none stroke-[#5B8FF9]" strokeWidth="8" />
            </g>
          </svg>
        </div>
      }
    />
  )
}
