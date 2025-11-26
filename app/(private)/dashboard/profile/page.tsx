"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Save, Pencil } from "lucide-react"
import { toast } from "sonner"

// Mock data for initial display (simulating DB data)
const INITIAL_USER = {
  firstName: "Musharof",
  lastName: "Chowdhury",
  role: "Team Manager",
  email: "randomuser@pimjo.com",
  phone: "+09 363 398 46",
  bio: "Team Manager",
  address: "123 Main St",
  city: "Phoenix",
  state: "Arizona",
  postalCode: "ERT 2489",
  country: "United States",
  taxId: "AS4568384",
  profileImage: "/placeholder.svg",
}

export default function ProfilePage() {
  const [user, setUser] = useState(INITIAL_USER)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      const updatedUser = { ...user, profileImage: imageUrl }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      toast.success("Image updated")
    }
  }

  const handleSave = () => {
    setIsEditing(false)
    localStorage.setItem("user", JSON.stringify(user))
    toast.success("Profile updated successfully")
  }

  return (
    <div className="space-y-6">
      {/* Top Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                <AvatarImage src={user.profileImage || "/placeholder.svg"} alt={user.firstName} />
                <AvatarFallback className="text-xl bg-[#5B8FF9] text-white">{user.firstName[0]}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-[#CD7F32] text-white rounded-full hover:bg-[#B86F28] transition-colors shadow-sm"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="flex-1 text-center md:text-left space-y-1">
              <h2 className="text-2xl font-bold text-foreground">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                <span className="font-medium text-[#CD7F32]">{user.role}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className={isEditing ? "bg-muted" : "border-[#CD7F32] text-[#CD7F32] hover:bg-[#CD7F32]/10"}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {isEditing ? "Cancel Edit" : "Edit"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground font-normal">First Name</Label>
            {isEditing ? (
              <Input value={user.firstName} onChange={(e) => setUser({ ...user, firstName: e.target.value })} />
            ) : (
              <div className="font-medium">{user.firstName}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground font-normal">Last Name</Label>
            {isEditing ? (
              <Input value={user.lastName} onChange={(e) => setUser({ ...user, lastName: e.target.value })} />
            ) : (
              <div className="font-medium">{user.lastName}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground font-normal">Email address</Label>
            {isEditing ? (
              <Input value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} />
            ) : (
              <div className="font-medium">{user.email}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground font-normal">Phone</Label>
            {isEditing ? (
              <Input value={user.phone} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
            ) : (
              <div className="font-medium">{user.phone}</div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <Label className="text-muted-foreground font-normal">Bio</Label>
            {isEditing ? (
              <Input value={user.bio} onChange={(e) => setUser({ ...user, bio: e.target.value })} />
            ) : (
              <div className="font-medium">{user.bio}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[#CD7F32] hover:bg-[#B86F28] text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
