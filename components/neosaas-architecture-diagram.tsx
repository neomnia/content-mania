"use client"

import { Card } from "@/components/ui/card"
import { Database, Server, Globe, Lock, Zap, Users } from "lucide-react"

export function NeoSaasArchitectureDiagram() {
  return (
    <div className="relative w-full max-w-[600px] h-[500px] p-8">
      <div className="space-y-6">
        {/* Frontend Layer */}
        <div className="flex items-center justify-center gap-4">
          <Card className="flex flex-col items-center justify-center p-6 w-48 h-32 bg-gradient-to-br from-[#CD7F32]/10 to-background border-[#CD7F32]/30">
            <Globe className="h-10 w-10 text-[#CD7F32] mb-2" />
            <p className="text-sm font-semibold text-center">Next.js Frontend</p>
            <p className="text-xs text-muted-foreground">React 19</p>
          </Card>
        </div>

        {/* Middle Layer - API */}
        <div className="flex justify-center">
          <div className="w-px h-8 bg-gradient-to-b from-[#CD7F32]/50 to-transparent"></div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Card className="flex flex-col items-center justify-center p-6 w-48 h-32 bg-gradient-to-br from-[#CD7F32]/10 to-background border-[#CD7F32]/30">
            <Server className="h-10 w-10 text-[#CD7F32] mb-2" />
            <p className="text-sm font-semibold text-center">API Routes</p>
            <p className="text-xs text-muted-foreground">Server Actions</p>
          </Card>
        </div>

        {/* Bottom Layer - Services */}
        <div className="flex justify-center">
          <div className="w-px h-8 bg-gradient-to-b from-[#CD7F32]/50 to-transparent"></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="flex flex-col items-center justify-center p-4 h-24 bg-gradient-to-br from-[#CD7F32]/5 to-background border-[#CD7F32]/20">
            <Database className="h-8 w-8 text-[#CD7F32] mb-1" />
            <p className="text-xs font-semibold text-center">Neon DB</p>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 h-24 bg-gradient-to-br from-[#CD7F32]/5 to-background border-[#CD7F32]/20">
            <Lock className="h-8 w-8 text-[#CD7F32] mb-1" />
            <p className="text-xs font-semibold text-center">Auth</p>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 h-24 bg-gradient-to-br from-[#CD7F32]/5 to-background border-[#CD7F32]/20">
            <Zap className="h-8 w-8 text-[#CD7F32] mb-1" />
            <p className="text-xs font-semibold text-center">Payments</p>
          </Card>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Scalable, Secure, Modern Architecture
          </p>
        </div>
      </div>
    </div>
  )
}
