"use client"

import { useState, useEffect } from "react"
import { getSystemLogs, deleteOldLogs, type LogFilter } from "@/app/actions/logs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Loader2, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function LogsClient() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<LogFilter>({
    category: "all",
    level: "all",
    search: "",
  })
  const { toast } = useToast()

  const fetchLogs = async () => {
    setLoading(true)
    const result = await getSystemLogs(filters)
    if (result.success && result.data) {
      setLogs(result.data)
    } else {
      toast({
        title: "Error",
        description: "Failed to fetch logs",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs()
    }, 500)
    return () => clearTimeout(timer)
  }, [filters])

  const handleDeleteOldLogs = async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const result = await deleteOldLogs(thirtyDaysAgo)
    if (result.success) {
      toast({
        title: "Success",
        description: "Logs older than 30 days deleted",
      })
      fetchLogs()
    } else {
      toast({
        title: "Error",
        description: "Failed to delete logs",
        variant: "destructive",
      })
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "info": return "default"
      case "warning": return "secondary"
      case "error": return "destructive"
      case "critical": return "destructive"
      default: return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Select
            value={filters.category}
            onValueChange={(val) => setFilters({ ...filters, category: val })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.level}
            onValueChange={(val) => setFilters({ ...filters, level: val })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Old Logs
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all logs older than 30 days. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOldLogs}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Events</CardTitle>
          <CardDescription>
            Monitor all system activities, errors, and events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No logs found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLevelBadge(log.level) as any}>
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user ? log.user.email : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
