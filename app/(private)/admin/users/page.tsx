import { getUsers } from "@/app/actions/users"
import { UsersTable } from "@/components/admin/users-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSuperAdmin } from "@/lib/auth/server"

export default async function UsersPage() {
  // Only super_admin can access user management
  await requireSuperAdmin()

  const { data: users, success } = await getUsers()

  if (!success || !users) {
    return <div>Failed to load users</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across the platform.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A list of all users in the system including their name, email, company, and role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable initialUsers={users as any} />
        </CardContent>
      </Card>
    </div>
  )
}
