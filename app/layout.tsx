import type React from "react"

import { ThemeProvider } from "@/components/common/theme-provider"
import { BackToTop } from "@/components/common/back-to-top"
import { Toaster } from "@/components/ui/sonner"
import "@/styles/globals.css"

import { Inter, Geist_Mono as V0_Font_Geist_Mono } from 'next/font/google'
import { getPlatformConfig } from "@/lib/config"

// Initialize fonts
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata() {
  const config = await getPlatformConfig()

  return {
    title: {
      default: config.siteName,
      template: `%s | ${config.siteName}`,
    },
    description: "NeoSaaS provides all the tools you need to build, launch, and scale your SaaS business.",
    generator: 'v0.app',
    icons: config.logo ? [{ rel: "icon", url: config.logo }] : [{ rel: "icon", url: "/favicon.ico" }],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <BackToTop />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
