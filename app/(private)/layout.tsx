import { PrivateSidebar } from "@/components/private-dashboard/sidebar"
import { PrivateHeader } from "@/components/private-dashboard/header"

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <PrivateSidebar />
      <div className="flex flex-1 flex-col">
        <PrivateHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
