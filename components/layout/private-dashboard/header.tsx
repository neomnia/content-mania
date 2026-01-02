"use client"

import { Menu, LogOut, User, CreditCard, Search, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/common/theme-toggle"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePlatformConfig } from "@/contexts/platform-config-context"
import { useCart } from "@/contexts/cart-context"

interface UserData {
  firstName: string
  lastName: string
  email: string
  role: string
  position?: string
  profileImage: string | null
}

interface PrivateHeaderProps {
  onMenuClick?: () => void
}

export function PrivateHeader({ onMenuClick }: PrivateHeaderProps) {
  const router = useRouter()
  const { logo, siteName } = usePlatformConfig()
  const { itemCount } = useCart()
  const [user, setUser] = useState<UserData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ name: string; path: string; category: string; keywords: string[]; score?: number }>>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      // Default mock data
      setUser({
        firstName: "Musharof",
        lastName: "Chowdhury",
        email: "randomuser@pimjo.com",
        role: "Team Manager",
        position: "Team Manager",
        profileImage: null,
      })
    }

    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("user")
      if (updatedUser) {
        setUser(JSON.parse(updatedUser))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsSearching(true)
      const timer = setTimeout(() => {
        // Catalogue complet des pages et fonctionnalités du dashboard
        const dashboardElements = [
          // Pages principales
          { name: "Dashboard Principal", path: "/dashboard", category: "Navigation", keywords: ["accueil", "home", "main"] },
          { name: "Mon Profil", path: "/dashboard/profile", category: "Compte", keywords: ["profile", "user", "compte", "utilisateur", "settings"] },
          { name: "Paiements & Facturation", path: "/dashboard/payments", category: "Finance", keywords: ["billing", "payments", "facture", "invoice"] },
          { name: "Panier", path: "/dashboard/cart", category: "Commerce", keywords: ["cart", "shopping", "achats"] },
          
          // Administration
          { name: "Admin Dashboard", path: "/admin", category: "Administration", keywords: ["admin", "administration", "gestion"] },
          { name: "Gestion des Utilisateurs", path: "/admin/users", category: "Administration", keywords: ["users", "utilisateurs", "members", "membres"] },
          { name: "Gestion des Commandes", path: "/admin/orders", category: "Commerce", keywords: ["orders", "commandes", "sales", "ventes"] },
          { name: "Gestion des Produits", path: "/admin/products", category: "Commerce", keywords: ["products", "produits", "inventory", "stock", "catalogue"] },
          { name: "Taux de TVA", path: "/admin/vat-rates", category: "Configuration", keywords: ["vat", "tva", "tax", "taxes"] },
          { name: "Pages & ACL", path: "/admin/pages", category: "Configuration", keywords: ["pages", "acl", "access", "permissions", "droits"] },
          { name: "Configuration Email", path: "/admin/mail", category: "Configuration", keywords: ["mail", "email", "smtp", "transactional"] },
          { name: "API Management", path: "/admin/api", category: "Développement", keywords: ["api", "keys", "clés", "integration"] },
          { name: "Logs Système", path: "/admin/logs", category: "Monitoring", keywords: ["logs", "journal", "events", "événements", "monitoring"] },
          { name: "Pages Légales", path: "/admin/legal", category: "Configuration", keywords: ["legal", "légal", "privacy", "terms", "mentions"] },
          { name: "Paramètres", path: "/admin/settings", category: "Configuration", keywords: ["settings", "configuration", "paramètres", "config"] },
          
          // Exemples & Démo
          { name: "Dashboard Exemple", path: "/dashboard-exemple", category: "Exemples", keywords: ["demo", "example", "exemple"] },
          { name: "Test Checkout", path: "/admin/test-checkout", category: "Tests", keywords: ["test", "checkout", "paiement"] },
          
          // Store Public
          { name: "Boutique", path: "/store", category: "Commerce", keywords: ["store", "shop", "boutique", "magasin"] },
          { name: "Pricing", path: "/pricing", category: "Commercial", keywords: ["pricing", "tarifs", "plans", "abonnements"] },
          
          // Documentation
          { name: "Documentation", path: "/docs", category: "Aide", keywords: ["docs", "documentation", "help", "aide"] },
          { name: "Installation", path: "/docs/installation", category: "Aide", keywords: ["install", "setup", "configuration"] },
          { name: "Architecture", path: "/docs/architecture", category: "Aide", keywords: ["architecture", "structure"] },
        ]

        // Algorithme de recherche amélioré avec scoring
        const results = dashboardElements
          .map((element) => {
            const query = searchQuery.toLowerCase()
            let score = 0

            // Score pour correspondance exacte du nom
            if (element.name.toLowerCase() === query) {
              score += 100
            }

            // Score pour correspondance du début du nom
            if (element.name.toLowerCase().startsWith(query)) {
              score += 50
            }

            // Score pour correspondance dans le nom
            if (element.name.toLowerCase().includes(query)) {
              score += 30
            }

            // Score pour correspondance dans le path
            if (element.path.toLowerCase().includes(query)) {
              score += 20
            }

            // Score pour correspondance dans les mots-clés
            if (element.keywords.some(keyword => keyword.includes(query))) {
              score += 15
            }

            // Score pour correspondance dans la catégorie
            if (element.category.toLowerCase().includes(query)) {
              score += 10
            }

            return { ...element, score }
          })
          .filter((element) => element.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8) // Limiter à 8 résultats max

        setSearchResults(results)
        setIsSearching(false)
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout failed", error)
    }
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    toast.success("Logged out successfully")
    // Force full page reload to ensure cookies are cleared and auth state is reset
    window.location.href = "/auth/login"
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6 relative">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Logo */}
      <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
         {logo ? (
            <img src={logo} alt={siteName} className="h-8 w-auto object-contain" />
         ) : (
            <span className="font-bold text-lg">
              <span className="text-foreground">{siteName.substring(0, 3)}</span>
              <span className="text-[#CD7F32]">{siteName.substring(3)}</span>
            </span>
         )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search admin pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#CD7F32] focus:border-transparent"
            />
          </div>

          {searchQuery && (
            <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={result.path}
                      onClick={() => {
                        router.push(result.path)
                        setSearchQuery("")
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3 border-b last:border-b-0 border-border/50"
                    >
                      <Search className="h-4 w-4 text-[#CD7F32] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{result.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#CD7F32]/10 text-[#CD7F32] font-medium whitespace-nowrap">
                            {result.category}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{result.path}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Aucun résultat trouvé</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Essayez "users", "products", "admin", "settings"...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <ThemeToggle />

        {/* Cart Icon with Badge */}
        {itemCount > 0 && (
          <Link href="/dashboard/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#CD7F32] text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in duration-300">
                {itemCount}
              </span>
            </Button>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-[#CD7F32]/20">
                <AvatarImage
                  src={user?.profileImage || "/placeholder.svg?height=40&width=40"}
                  alt={user ? `${user.firstName} ${user.lastName}` : "User"}
                />
                <AvatarFallback className="bg-[#CD7F32] text-white font-semibold">
                  {user ? getInitials(user.firstName, user.lastName) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold">{user ? `${user.firstName} ${user.lastName}` : "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "user@neosaas.com"}</p>
                <p className="text-xs text-[#CD7F32] font-medium">{user?.position || user?.role || "Member"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/payments" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing & Payments
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
