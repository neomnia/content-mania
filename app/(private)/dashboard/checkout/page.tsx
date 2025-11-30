"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, CreditCard, Lock, Mail, ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const modules = [
  {
    id: "1",
    name: "Payment Module",
    price: 299,
    icon: CreditCard,
    deliveryTime: "48 hours",
  },
  {
    id: "2",
    name: "Authentication Module",
    price: 399,
    icon: Lock,
    deliveryTime: "48 hours",
  },
  {
    id: "3",
    name: "Emailing Module",
    price: 249,
    icon: Mail,
    deliveryTime: "48 hours",
  },
]

const plans = [
  {
    id: "starter",
    name: "Starter Plan",
    price: 199,
    deliveryTime: "2-hour session",
    description: "Live walkthrough and setup assistance",
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: 699,
    deliveryTime: "Multiple sessions",
    description: "In-depth onboarding and advanced configuration",
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    price: 2999,
    deliveryTime: "Comprehensive support",
    description: "Full architecture review and optimization",
  },
  {
    id: "custom",
    name: "Custom Hourly",
    price: 120,
    deliveryTime: "Flexible scheduling",
    description: "Hourly consulting for specific needs",
    isHourly: true,
  },
]

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedModule, setSelectedModule] = useState<(typeof modules)[0] | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[0] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  })

  useEffect(() => {
    const moduleId = searchParams.get("module")
    const planId = searchParams.get("plan")

    if (moduleId) {
      const module = modules.find((m) => m.id === moduleId)
      if (module) {
        setSelectedModule(module)
      } else {
        router.push("/dashboard")
      }
    } else if (planId) {
      const plan = plans.find((p) => p.id === planId)
      if (plan) {
        setSelectedPlan(plan)
      } else {
        router.push("/dashboard")
      }
    } else {
      router.push("/dashboard")
    }

    const profileData = localStorage.getItem("userProfile")
    if (profileData) {
      try {
        const profile = JSON.parse(profileData)
        setFormData({
          name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
          email: profile.email || "",
          company: profile.company || "",
          phone: profile.phone || "",
        })
      } catch (error) {
        console.error("Failed to parse profile data:", error)
      }
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      toast.success("Order placed successfully! Redirecting to booking...")
      // Redirect to booking after successful payment
      window.location.href = "https://outlook.office365.com/book/neosaas@neomnia.net/?ismsaljsauthenabled=true"
    }, 2000)
  }

  const selectedItem = selectedModule || selectedPlan
  if (!selectedItem) {
    return null
  }

  const Icon = selectedModule?.icon

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card className="border-[#CD7F32]">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A] dark:text-white">Order Summary</CardTitle>
            <CardDescription className="text-[#6B7280]">
              Review your {selectedModule ? "module" : "plan"} selection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#F5F5F5] dark:bg-[#1A1A1A]/50">
              {Icon && (
                <div className="p-3 rounded-lg bg-[#CD7F32]">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-[#1A1A1A] dark:text-white">{selectedItem.name}</h3>
                {selectedPlan && <p className="text-sm text-[#6B7280] mt-1">{selectedPlan.description}</p>}
                <Badge className="mt-2 bg-[#CD7F32] text-white border-0">
                  {selectedModule ? `Delivery: ${selectedModule.deliveryTime}` : selectedPlan?.deliveryTime}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">
                  {selectedModule ? "Module Price" : selectedPlan?.isHourly ? "Hourly Rate" : "Plan Price"}
                </span>
                <span className="font-medium text-[#1A1A1A] dark:text-white">
                  €{selectedItem.price}
                  {selectedPlan?.isHourly ? "/hour" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Setup & Configuration</span>
                <span className="font-medium text-[#CD7F32]">Included</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Technical Support (30 days)</span>
                <span className="font-medium text-[#CD7F32]">Included</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-lg font-bold">
              <span className="text-[#1A1A1A] dark:text-white">Total</span>
              <span className="text-[#CD7F32]">€{selectedItem.price}</span>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                <span>Module delivered within 48 hours</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                <span>Free technical consultation included</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                <span>30-day support guarantee</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1A1A1A] dark:text-white">Contact Information</CardTitle>
            <CardDescription className="text-[#6B7280]">We'll contact you to schedule module delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#1A1A1A] dark:text-white">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="border-[#F5F5F5]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A1A1A] dark:text-white">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  className="border-[#F5F5F5]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-[#1A1A1A] dark:text-white">
                  Company
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your Company Inc."
                  className="border-[#F5F5F5]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#1A1A1A] dark:text-white">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                  className="border-[#F5F5F5]"
                />
              </div>

              <Separator className="my-6" />

              <Button
                type="submit"
                className="w-full bg-[#CD7F32] hover:bg-[#B86F28] text-white"
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <Calendar className="mr-2 h-5 w-5" />
                    Proceed to Booking
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-[#6B7280] mt-4">
                After submitting, you'll be redirected to our booking system to schedule your delivery consultation.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
