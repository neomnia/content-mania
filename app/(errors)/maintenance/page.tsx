export default function MaintenancePage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-white dark:bg-gray-900">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 -z-10">
        <svg width="364" height="201" viewBox="0 0 364 201" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24"
            stroke="url(#paint0_linear_25:218)"
          />
          <path
            d="M-22.1107 72.3303C5.65989 66.4798 73.3965 64.9086 122.178 105.427C183.155 156.076 201.59 162.093 236.333 166.607C271.076 171.12 309.718 183.657 334.889 212.24"
            stroke="url(#paint1_linear_25:218)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_25:218"
              x1="184.389"
              y1="69.2405"
              x2="184.389"
              y2="212.24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#CD7F32" stopOpacity="0" />
              <stop offset="1" stopColor="#CD7F32" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_25:218"
              x1="156.389"
              y1="69.2405"
              x2="156.389"
              y2="212.24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#CD7F32" stopOpacity="0" />
              <stop offset="1" stopColor="#CD7F32" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 -z-10">
        <svg width="364" height="201" viewBox="0 0 364 201" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M358.11 129.67C330.34 135.52 262.6 137.09 213.82 96.5732C152.84 45.9238 134.41 39.9074 99.6643 35.3939C64.9206 30.8805 26.2788 18.3441 1.10778 -10.2389"
            stroke="url(#paint0_linear_25:219)"
          />
          <path
            d="M386.11 129.67C358.34 135.52 290.6 137.09 241.82 96.5732C180.84 45.9238 162.41 39.9074 127.66 35.3939C92.9206 30.8805 54.2788 18.3441 29.1078 -10.2389"
            stroke="url(#paint1_linear_25:219)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_25:219"
              x1="179.61"
              y1="132.76"
              x2="179.61"
              y2="-10.2389"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#CD7F32" stopOpacity="0" />
              <stop offset="1" stopColor="#CD7F32" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_25:219"
              x1="207.61"
              y1="132.76"
              x2="207.61"
              y2="-10.2389"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#CD7F32" stopOpacity="0" />
              <stop offset="1" stopColor="#CD7F32" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated icon */}
        <div className="mb-8 inline-flex h-32 w-32 items-center justify-center rounded-full bg-[#CD7F32]/10">
          <div className="h-24 w-24 rounded-full bg-[#CD7F32]/20 flex items-center justify-center animate-pulse">
            <svg
              className="h-12 w-12 text-[#CD7F32]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Title and message */}
        <h1 className="mb-4 text-4xl font-bold text-[#1A1A1A] dark:text-white sm:text-5xl">Under Maintenance</h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          We're currently performing scheduled maintenance to improve your experience. We'll be back online shortly!
        </p>

        {/* Additional info */}
        <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="h-5 w-5 text-[#CD7F32]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span>Expected downtime: ~30 minutes</span>
          </div>
        </div>

        {/* Back home button */}
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#CD7F32] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#B8691C]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Homepage
        </a>

        {/* Contact support */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Need urgent assistance?{" "}
          <a href="mailto:support@neosaas.com" className="font-medium text-[#CD7F32] hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}
