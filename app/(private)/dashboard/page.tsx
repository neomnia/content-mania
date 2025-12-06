"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CreditCard, Lock, Mail, Calendar, CheckCircle2, Zap, Shield, TrendingUp, Info } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const modules = [
  {
    id: 1,
    name: "Payment Module",
    description: "Complete Stripe and Lago integration to manage recurring payments and automated billing",
    icon: CreditCard,
    color: "bg-[#CD7F32]",
    features: [
      "Integrated Stripe payments",
      "Automated billing with Lago",
      "Subscription management",
      "Configured webhooks",
      "Multi-currency support",
    ],
    status: "active",
    price: "From €299",
    deliveryTime: "48 hours",
  },
  {
    id: 2,
    name: "Authentication Module",
    description: "Custom authentication system with Auth0, advanced roles and permissions management",
    icon: Lock,
    color: "bg-[#CD7F32]",
    features: [
      "Integrated Auth0",
      "Social logins (Google, GitHub, etc.)",
      "Roles and permissions management",
      "Secure JWT tokens",
      "Multi-tenant ready",
    ],
    status: "active",
    price: "From €399",
    deliveryTime: "48 hours",
  },
  {
    id: 3,
    name: "Emailing Module",
    description: "Custom emailing solution with Resend and AWS SES for your campaigns and transactional emails",
    icon: Mail,
    color: "bg-[#CD7F32]",
    features: [
      "Integrated Resend & AWS SES",
      "Customizable email templates",
      "Automated transactional emails",
      "Open and click analytics",
      "Contact management",
    ],
    status: "active",
    price: "From €249",
    deliveryTime: "48 hours",
  },
]

export default function DashboardPage() {
  const [showProfileAlert, setShowProfileAlert] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        // Check if profile is incomplete (default lastName is 'User')
        if (user.lastName === "User") {
          setShowProfileAlert(true)
        }
      } catch (e) {
        console.error("Error parsing user data", e)
      }
    }
  }, [])

  return (
    <div className="space-y-8">
      {showProfileAlert && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Complete your profile</AlertTitle>
          <AlertDescription>
            Please complete your profile to personalize your account.{" "}
            <Link href="/dashboard/profile" className="underline font-medium hover:text-blue-600 dark:hover:text-blue-100">
              Go to Profile
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section - NeoSaaS Bronze theme */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#1A1A1A] to-[#CD7F32] p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to NeoSaaS</h1>
          <p className="text-lg text-white/90 mb-6">
            Accelerate your application development with our ready-to-use modules
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="https://outlook.office365.com/book/neosaas@neomnia.net/?ismsaljsauthenabled=true"
              target="_blank"
            >
              <Button size="lg" className="bg-[#CD7F32] text-white hover:bg-[#B86F28]">
                <Calendar className="mr-2 h-5 w-5" />
                Book a Consultation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Available Modules</h2>
          <p className="text-[#6B7280]">Ready-to-use modules to accelerate your development</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="relative overflow-hidden hover:shadow-lg transition-shadow border-[#F5F5F5]"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 ${module.color} opacity-10 rounded-full -mr-16 -mt-16`}
              />

              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${module.color}`}>
                    <module.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-[#CD7F32] text-white border-0 hover:bg-[#B86F28]">{module.deliveryTime}</Badge>
                </div>
                <CardTitle className="text-xl mb-2 text-[#1A1A1A] dark:text-white">{module.name}</CardTitle>
                <CardDescription className="text-sm text-[#6B7280]">{module.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {module.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                      <span className="text-[#6B7280]">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#F5F5F5]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-[#CD7F32]">{module.price}</span>
                  </div>
                  <Link href={`/dashboard/checkout?module=${module.id}`}>
                    <Button className="w-full bg-[#CD7F32] hover:bg-[#B86F28] text-white">Order this Module</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Consulting & Support Plans Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Consulting & Support Plans</h2>
          <p className="text-[#6B7280]">Expert guidance to maximize your NeoSaaS implementation</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Starter Plan */}
          <Card className="flex flex-col border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription className="mt-2">Ideal for solo devs or small teams</CardDescription>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#CD7F32]">$199</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <Link href="/dashboard/checkout?plan=starter">
                <Button className="w-full bg-[#CD7F32] hover:bg-[#B86F28] text-white">Get Started</Button>
              </Link>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Includes:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>2-hours live walkthrough</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Docker setup assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>CLI usage & deployment guide</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Environment configuration</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col border-2 border-[#22C55E] relative hover:shadow-lg transition-shadow">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-[#22C55E] text-white">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription className="mt-2">Perfect for teams building core modules</CardDescription>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#CD7F32]">$699</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <Link href="/dashboard/checkout?plan=pro">
                <Button className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90">Get Started</Button>
              </Link>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Includes:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>In-depth onboarding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>AWS & CDK walkthrough</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Branching strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Stripe/CMS setup</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="flex flex-col border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <CardDescription className="mt-2">Full production SaaS guidance</CardDescription>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#CD7F32]">$2,999</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <Link href="/dashboard/checkout?plan=enterprise">
                <Button className="w-full bg-[#CD7F32] hover:bg-[#B86F28] text-white">Get Started</Button>
              </Link>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Includes:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Architecture review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Advanced customization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>CI/CD fine-tuning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Performance optimization</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Custom Plan */}
          <Card className="flex flex-col border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Custom</CardTitle>
              <CardDescription className="mt-2">Flexible hourly consulting</CardDescription>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#CD7F32]">$120</span>
                <span className="text-muted-foreground">/hour</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <Link href="/dashboard/checkout?plan=custom">
                <Button className="w-full bg-[#CD7F32] hover:bg-[#B86F28] text-white">Contact Us</Button>
              </Link>

              <div className="space-y-2">
                <p className="text-sm font-semibold">We assist with:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Complex debugging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Third-party integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Multitenancy setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#CD7F32] mt-0.5 shrink-0" />
                    <span>Stripe customization</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Development Section */}
      <Card className="border-2 border-[#CD7F32]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2 text-[#1A1A1A] dark:text-white">Need Custom Development?</CardTitle>
              <CardDescription className="text-base text-[#6B7280]">
                Our team can create a custom solution tailored to your specific needs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-[#1A1A1A] dark:text-white">Hourly Services</h3>
              <ul className="space-y-2 text-[#6B7280]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                  Next.js application development
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                  Third-party API integration
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                  Migration and optimization
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                  Dedicated technical support
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-between">
              <div className="space-y-2 mb-4">
                <div className="text-3xl font-bold text-[#CD7F32]">€150/hour</div>
                <p className="text-sm text-[#6B7280]">Senior developer rate with complete expertise of our stack</p>
              </div>
              <Link
                href="https://outlook.office365.com/book/neosaas@neomnia.net/?ismsaljsauthenabled=true"
                target="_blank"
              >
                <Button size="lg" className="w-full bg-[#CD7F32] hover:bg-[#B86F28] text-white">
                  <Calendar className="mr-2 h-5 w-5" />
                  Book a Free Consultation
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Choose NeoSaaS */}
      <Card className="bg-[#F5F5F5] dark:bg-[#1A1A1A]/50 border-[#F5F5F5]">
        <CardHeader>
          <CardTitle className="text-2xl text-[#1A1A1A] dark:text-white">Why Choose NeoSaaS?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#CD7F32]/10">
                  <Zap className="h-5 w-5 text-[#CD7F32]" />
                </div>
                <div className="font-semibold text-lg text-[#1A1A1A] dark:text-white">Fast Deployment</div>
              </div>
              <p className="text-sm text-[#6B7280]">Pre-configured modules ready to be deployed in minutes</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#CD7F32]/10">
                  <Shield className="h-5 w-5 text-[#CD7F32]" />
                </div>
                <div className="font-semibold text-lg text-[#1A1A1A] dark:text-white">Secure by Default</div>
              </div>
              <p className="text-sm text-[#6B7280]">Robust authentication, encryption, and security best practices</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#CD7F32]/10">
                  <TrendingUp className="h-5 w-5 text-[#CD7F32]" />
                </div>
                <div className="font-semibold text-lg text-[#1A1A1A] dark:text-white">Scalable</div>
              </div>
              <p className="text-sm text-[#6B7280]">Modern architecture designed to grow with your business</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
