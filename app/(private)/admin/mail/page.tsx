"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Settings, Edit3, Copy, Check, Cloud } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function ScalewayIcon({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded bg-purple-600 text-white ${className}`}>
      <Cloud className="h-3 w-3" />
    </div>
  )
}

const emailTypes = [
  { id: "register", name: "Welcome / Registration", description: "Sent when a new user signs up" },
  { id: "invite", name: "Team Invitation", description: "Sent when inviting a member to a team" },
  { id: "delete", name: "Account Deletion", description: "Sent when a user requests account deletion" },
  { id: "order", name: "Build & Order", description: "Order validation with invoice attached" },
]

const variables = [
  { name: "User First Name", value: "{{firstName}}" },
  { name: "User Last Name", value: "{{lastName}}" },
  { name: "User Email", value: "{{email}}" },
  { name: "Company Name", value: "{{companyName}}" },
  { name: "Action URL", value: "{{actionUrl}}" },
  { name: "Site Name", value: "{{siteName}}" },
]

export default function MailPage() {
  const [selectedType, setSelectedType] = useState(emailTypes[0].id)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("html")
  const [copiedVar, setCopiedVar] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState("resend")

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedVar(value)
    setTimeout(() => setCopiedVar(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Mail Management</h1>
        <p className="text-muted-foreground mt-1">Configure email providers and templates</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Email Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emailTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${
                  selectedType === type.id
                    ? "bg-[#CD7F32]/10 border-[#CD7F32] text-[#CD7F32] font-medium"
                    : "hover:bg-muted border-transparent"
                }`}
              >
                <div className="font-medium">{type.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#CD7F32]" />
                  Configuration
                </CardTitle>
                <CardDescription>Settings for {emailTypes.find((t) => t.id === selectedType)?.name}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <span className="text-sm font-medium">Enabled</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" /> Provider Settings
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sending Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="scaleway">
                        <span className="flex items-center gap-2">
                          <ScalewayIcon className="h-4 w-4" />
                          Scaleway TEM
                        </span>
                      </SelectItem>
                      <SelectItem value="aws">AWS SES</SelectItem>
                      <SelectItem value="smtp">SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input defaultValue="NeoSaaS Team" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Edit3 className="h-4 w-4" /> Template Content
                </h3>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 border-dashed bg-transparent">
                        {copiedVar ? (
                          <Check className="h-3 w-3 mr-2 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 mr-2" />
                        )}
                        Variables
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {variables.map((variable) => (
                        <DropdownMenuItem
                          key={variable.value}
                          onClick={() => handleCopy(variable.value)}
                          className="flex justify-between cursor-pointer"
                        >
                          <span>{variable.name}</span>
                          <code className="text-xs bg-muted px-1 rounded">{variable.value}</code>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className={isEditing ? "bg-[#CD7F32] hover:bg-[#B8691C]" : ""}
                  >
                    {isEditing ? "Save Template" : "Edit Template"}
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input defaultValue="Welcome to NeoSaaS!" />
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger
                        value="html"
                        className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white"
                      >
                        HTML
                      </TabsTrigger>
                      <TabsTrigger
                        value="text"
                        className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white"
                      >
                        Plain Text
                      </TabsTrigger>
                      <TabsTrigger
                        value="preview"
                        className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white"
                      >
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="html" className="mt-4">
                      <Textarea
                        className="font-mono min-h-[300px]"
                        defaultValue="<h1>Welcome {{firstName}}!</h1><p>Thanks for joining us.</p>"
                      />
                    </TabsContent>
                    <TabsContent value="text" className="mt-4">
                      <Textarea
                        className="font-mono min-h-[300px]"
                        defaultValue="Welcome {{firstName}}! Thanks for joining us."
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded-lg p-6 min-h-[300px] prose max-w-none">
                        <h1>Welcome John!</h1>
                        <p>Thanks for joining us.</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="text-sm text-muted-foreground mb-2">Subject: Welcome to NeoSaaS!</div>
                  <div className="prose max-w-none text-sm">
                    <p>Template preview hidden. Click "Edit Template" to modify.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
