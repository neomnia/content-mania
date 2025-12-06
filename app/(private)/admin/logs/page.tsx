import { LogsClient } from "./logs-client"

export default function LogsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">
            View system activities, errors, and events.
          </p>
        </div>
      </div>
      <LogsClient />
    </div>
  )
}
