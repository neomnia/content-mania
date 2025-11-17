import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, Shield, Zap, Globe, HeadphonesIcon } from 'lucide-react'

export default function EnterprisePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise</h1>
          <p className="text-muted-foreground mt-2">
            Enterprise features and team management
          </p>
        </div>
        <Badge variant="secondary" className="bg-[#CD7F32] text-white">
          Enterprise Plan
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Building2 className="h-8 w-8 text-[#5B8FF9] mb-2" />
            <CardTitle>Organization</CardTitle>
            <CardDescription>Manage your organization settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Team Members</span>
                <span className="font-medium">48</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Departments</span>
                <span className="font-medium">6</span>
              </div>
              <Button className="w-full mt-4 bg-[#5B8FF9] hover:bg-[#4A7FE8]">
                Manage Organization
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-[#5B8FF9] mb-2" />
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Control team access and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Teams</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending Invites</span>
                <span className="font-medium">3</span>
              </div>
              <Button className="w-full mt-4 bg-[#5B8FF9] hover:bg-[#4A7FE8]">
                View Teams
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 text-[#5B8FF9] mb-2" />
            <CardTitle>Security</CardTitle>
            <CardDescription>Advanced security features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SSO</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">2FA Required</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <Button className="w-full mt-4 bg-[#5B8FF9] hover:bg-[#4A7FE8]">
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise Features</CardTitle>
          <CardDescription>Available features with your enterprise plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-[#5B8FF9] mt-0.5" />
              <div>
                <h4 className="font-medium">Advanced Analytics</h4>
                <p className="text-sm text-muted-foreground">Custom dashboards and detailed reporting</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-[#5B8FF9] mt-0.5" />
              <div>
                <h4 className="font-medium">Global Infrastructure</h4>
                <p className="text-sm text-muted-foreground">Deploy in multiple regions worldwide</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HeadphonesIcon className="h-5 w-5 text-[#5B8FF9] mt-0.5" />
              <div>
                <h4 className="font-medium">Priority Support</h4>
                <p className="text-sm text-muted-foreground">24/7 dedicated support team</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-[#5B8FF9] mt-0.5" />
              <div>
                <h4 className="font-medium">Enhanced Security</h4>
                <p className="text-sm text-muted-foreground">SSO, audit logs, and compliance tools</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
