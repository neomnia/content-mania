/**
 * Catalogue de recherche centralisé
 * Ce fichier définit tous les éléments indexés dans le système de recherche
 */

export interface SearchElement {
  name: string
  path: string
  category: string
  keywords: string[]
  section?: string // Pour identifier la section (admin, front, docs, etc.)
  description?: string
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

/**
 * Pages du site public (Front-end)
 */
export const frontendPages: SearchElement[] = [
  {
    name: "Accueil",
    path: "/",
    category: "Site Public",
    section: "front",
    keywords: ["home", "accueil", "landing", "page d'accueil"],
    description: "Page d'accueil du site"
  },
  {
    name: "Boutique",
    path: "/store",
    category: "Commerce",
    section: "front",
    keywords: ["store", "shop", "boutique", "magasin", "acheter", "buy", "products"],
    description: "Catalogue de produits et services"
  },
  {
    name: "Tarifs & Plans",
    path: "/pricing",
    category: "Commercial",
    section: "front",
    keywords: ["pricing", "tarifs", "plans", "abonnements", "subscription", "prix", "price"],
    description: "Grille tarifaire et plans d'abonnement"
  },
  {
    name: "Contact",
    path: "/contact",
    category: "Support",
    section: "front",
    keywords: ["contact", "contactez-nous", "support", "aide", "help"],
    description: "Formulaire de contact"
  },
  {
    name: "À propos",
    path: "/about",
    category: "Information",
    section: "front",
    keywords: ["about", "à propos", "qui sommes-nous", "entreprise", "company"],
    description: "Présentation de l'entreprise"
  },
  {
    name: "Mentions légales",
    path: "/legal/mentions",
    category: "Juridique",
    section: "front",
    keywords: ["legal", "mentions légales", "mentions", "juridique"],
    description: "Mentions légales"
  },
  {
    name: "Politique de confidentialité",
    path: "/legal/privacy",
    category: "Juridique",
    section: "front",
    keywords: ["privacy", "confidentialité", "rgpd", "gdpr", "données personnelles", "data"],
    description: "Politique de confidentialité"
  },
  {
    name: "Conditions d'utilisation",
    path: "/legal/terms",
    category: "Juridique",
    section: "front",
    keywords: ["terms", "conditions", "cgu", "cgv", "conditions générales"],
    description: "Conditions générales d'utilisation"
  },
  {
    name: "Connexion",
    path: "/auth/login",
    category: "Authentification",
    section: "front",
    keywords: ["login", "connexion", "se connecter", "sign in"],
    description: "Page de connexion"
  },
  {
    name: "Inscription",
    path: "/auth/register",
    category: "Authentification",
    section: "front",
    keywords: ["register", "inscription", "créer un compte", "sign up"],
    description: "Créer un nouveau compte"
  },
]

/**
 * Pages du dashboard utilisateur (Authentifié)
 */
export const dashboardPages: SearchElement[] = [
  {
    name: "Dashboard Principal",
    path: "/dashboard",
    category: "Navigation",
    section: "dashboard",
    keywords: ["accueil", "home", "main", "dashboard"],
    description: "Tableau de bord principal",
    requiresAuth: true
  },
  {
    name: "Mon Profil",
    path: "/dashboard/profile",
    category: "Compte",
    section: "dashboard",
    keywords: ["profile", "user", "compte", "utilisateur", "settings", "paramètres"],
    description: "Gérer mon profil",
    requiresAuth: true
  },
  {
    name: "Paiements & Facturation",
    path: "/dashboard/payments",
    category: "Finance",
    section: "dashboard",
    keywords: ["billing", "payments", "facture", "invoice", "paiement", "facturation"],
    description: "Historique de paiements",
    requiresAuth: true
  },
  {
    name: "Panier",
    path: "/dashboard/cart",
    category: "Commerce",
    section: "dashboard",
    keywords: ["cart", "shopping", "achats", "panier"],
    description: "Mon panier d'achats",
    requiresAuth: true
  },
  {
    name: "Calendrier",
    path: "/dashboard/calendar",
    category: "Planning",
    section: "dashboard",
    keywords: ["calendar", "calendrier", "planning", "agenda"],
    description: "Vue calendrier",
    requiresAuth: true
  },
  {
    name: "Mes Rendez-vous",
    path: "/dashboard/appointments",
    category: "Planning",
    section: "dashboard",
    keywords: ["appointments", "rendez-vous", "booking", "réservation", "mes rendez-vous"],
    description: "Gérer mes rendez-vous",
    requiresAuth: true
  },
]

/**
 * Pages d'administration (Admin uniquement)
 */
export const adminPages: SearchElement[] = [
  {
    name: "Admin Dashboard",
    path: "/admin",
    category: "Administration",
    section: "admin",
    keywords: ["admin", "administration", "gestion", "dashboard", "backend"],
    description: "Tableau de bord administrateur",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Gestion des Utilisateurs",
    path: "/admin/users",
    category: "Administration",
    section: "admin",
    keywords: ["users", "utilisateurs", "members", "membres", "roles", "permissions"],
    description: "Gérer les utilisateurs et leurs rôles",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Gestion des Commandes",
    path: "/admin/orders",
    category: "Commerce",
    section: "admin",
    keywords: ["orders", "commandes", "sales", "ventes", "invoices", "factures"],
    description: "Gérer les commandes clients",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Rendez-vous Admin",
    path: "/admin/appointments",
    category: "Planning",
    section: "admin",
    keywords: ["appointments", "rendez-vous", "bookings", "réservations", "calendar", "admin"],
    description: "Gérer tous les rendez-vous",
    requiresAuth: true,
    requiresAdmin: true
  },
]

/**
 * Gestion des produits - Page principale et types
 */
export const productsPages: SearchElement[] = [
  {
    name: "Gestion des Produits",
    path: "/admin/products",
    category: "Commerce",
    section: "admin",
    keywords: ["products", "produits", "inventory", "stock", "catalogue"],
    description: "Gérer tous les produits",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Produits Standard",
    path: "/admin/products?type=standard",
    category: "Commerce",
    section: "admin",
    keywords: ["standard", "physical", "produits physiques", "stock"],
    description: "Produits physiques standard",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Produits Gratuits",
    path: "/admin/products?type=free",
    category: "Commerce",
    section: "admin",
    keywords: ["free", "gratuit", "freemium"],
    description: "Produits gratuits",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Produits Digitaux",
    path: "/admin/products?type=digital",
    category: "Commerce",
    section: "admin",
    keywords: ["digital", "téléchargeable", "download", "numérique"],
    description: "Produits téléchargeables",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Produits Rendez-vous",
    path: "/admin/products?type=appointment",
    category: "Commerce",
    section: "admin",
    keywords: ["appointment", "rendez-vous", "booking", "réservation", "service"],
    description: "Services avec prise de rendez-vous",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Taux de TVA",
    path: "/admin/vat-rates",
    category: "Commerce",
    section: "admin",
    keywords: ["vat", "tva", "tax", "taxes", "fiscalité"],
    description: "Gérer les taux de TVA",
    requiresAuth: true,
    requiresAdmin: true
  },
]

/**
 * Paramètres - Onglets et sections
 */
export const settingsPages: SearchElement[] = [
  {
    name: "Paramètres Généraux",
    path: "/admin/settings",
    category: "Configuration",
    section: "admin",
    keywords: ["settings", "general", "configuration", "paramètres", "site", "logo", "maintenance"],
    description: "Configuration générale du site",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Logs Système",
    path: "/admin/settings#logs",
    category: "Monitoring",
    section: "admin",
    keywords: ["logs", "journal", "events", "événements", "monitoring", "debug", "errors", "erreurs"],
    description: "Consulter les logs système",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Pages & ACL",
    path: "/admin/settings#pages",
    category: "Sécurité",
    section: "admin",
    keywords: ["pages", "acl", "access", "permissions", "droits", "roles", "security", "sécurité"],
    description: "Gérer les permissions des pages",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Configuration Site",
    path: "/admin/settings#general",
    category: "Configuration",
    section: "admin",
    keywords: ["site name", "url", "email", "contact", "gdpr", "nom du site"],
    description: "Nom, URL et contacts",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Logo & Branding",
    path: "/admin/settings#general",
    category: "Configuration",
    section: "admin",
    keywords: ["logo", "branding", "image", "visual", "marque", "identité visuelle"],
    description: "Gérer le logo et l'identité visuelle",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "SEO & Métadonnées",
    path: "/admin/settings#general",
    category: "Marketing",
    section: "admin",
    keywords: ["seo", "meta", "og", "open graph", "description", "référencement"],
    description: "Optimisation pour les moteurs de recherche",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Google Tag Manager",
    path: "/admin/settings#general",
    category: "Analytics",
    section: "admin",
    keywords: ["gtm", "google", "analytics", "tracking", "tag manager", "mesure d'audience"],
    description: "Configuration GTM",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Code Personnalisé",
    path: "/admin/settings#general",
    category: "Développement",
    section: "admin",
    keywords: ["custom code", "header", "footer", "script", "html", "javascript", "code"],
    description: "Injecter du code personnalisé",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "En-têtes HTTP",
    path: "/admin/settings#general",
    category: "Sécurité",
    section: "admin",
    keywords: ["http headers", "security", "cors", "csp", "https", "sécurité"],
    description: "Configurer les en-têtes de sécurité",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Réseaux Sociaux",
    path: "/admin/settings#general",
    category: "Marketing",
    section: "admin",
    keywords: ["social", "twitter", "facebook", "linkedin", "instagram", "github", "réseaux sociaux"],
    description: "Liens vers les réseaux sociaux",
    requiresAuth: true,
    requiresAdmin: true
  },
]

/**
 * Autres configurations admin
 */
export const configPages: SearchElement[] = [
  {
    name: "Configuration Email",
    path: "/admin/mail",
    category: "Communication",
    section: "admin",
    keywords: ["mail", "email", "smtp", "transactional", "resend", "templates", "emails"],
    description: "Configurer l'envoi d'emails",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "API Management",
    path: "/admin/api",
    category: "Développement",
    section: "admin",
    keywords: ["api", "keys", "clés", "integration", "webhook", "rest", "développeurs"],
    description: "Gérer les clés API",
    requiresAuth: true,
    requiresAdmin: true
  },
  {
    name: "Pages Légales Admin",
    path: "/admin/legal",
    category: "Juridique",
    section: "admin",
    keywords: ["legal", "légal", "privacy", "terms", "mentions", "rgpd", "gdpr", "cgu", "cgv"],
    description: "Éditer les pages légales",
    requiresAuth: true,
    requiresAdmin: true
  },
]

/**
 * Documentation (accessible selon configuration)
 */
export const documentationPages: SearchElement[] = [
  {
    name: "Documentation",
    path: "/docs",
    category: "Documentation",
    section: "docs",
    keywords: ["docs", "documentation", "help", "aide", "guide"],
    description: "Documentation du projet"
  },
  {
    name: "Guide de démarrage rapide",
    path: "/docs/quick-start",
    category: "Documentation",
    section: "docs",
    keywords: ["quick start", "démarrage", "getting started", "installation", "setup"],
    description: "Guide de démarrage rapide"
  },
  {
    name: "Troubleshooting",
    path: "/docs/troubleshooting",
    category: "Documentation",
    section: "docs",
    keywords: ["troubleshooting", "problèmes", "dépannage", "errors", "erreurs", "help"],
    description: "Guide de dépannage"
  },
  {
    name: "Système de recherche",
    path: "/docs/admin-search",
    category: "Documentation",
    section: "docs",
    keywords: ["search", "recherche", "navigation", "find"],
    description: "Documentation du système de recherche"
  },
  {
    name: "Architecture du projet",
    path: "/docs/architecture",
    category: "Documentation",
    section: "docs",
    keywords: ["architecture", "structure", "organisation", "tech stack"],
    description: "Architecture technique"
  },
]

/**
 * Catalogue complet - Combine tous les éléments
 */
export function getFullSearchCatalog(): SearchElement[] {
  return [
    ...frontendPages,
    ...dashboardPages,
    ...adminPages,
    ...productsPages,
    ...settingsPages,
    ...configPages,
    ...documentationPages,
  ]
}

/**
 * Filtrer le catalogue selon les permissions de l'utilisateur
 */
export function getFilteredCatalog(userRoles?: string[]): SearchElement[] {
  const catalog = getFullSearchCatalog()
  const isAdmin = userRoles?.some(role => 
    role.toLowerCase() === 'admin' || role.toLowerCase() === 'super_admin'
  )

  return catalog.filter(item => {
    // Si l'élément nécessite admin et l'utilisateur n'est pas admin
    if (item.requiresAdmin && !isAdmin) {
      return false
    }
    // Sinon, inclure l'élément
    return true
  })
}

/**
 * Rechercher dans le catalogue
 */
export function searchCatalog(
  query: string, 
  catalog: SearchElement[]
): Array<SearchElement & { score: number }> {
  const queryLower = query.toLowerCase()

  const results = catalog
    .map((element) => {
      let score = 0

      // Score pour correspondance exacte du nom
      if (element.name.toLowerCase() === queryLower) {
        score += 100
      }

      // Score pour correspondance du début du nom
      if (element.name.toLowerCase().startsWith(queryLower)) {
        score += 50
      }

      // Score pour correspondance dans le nom
      if (element.name.toLowerCase().includes(queryLower)) {
        score += 30
      }

      // Score pour correspondance dans le path
      if (element.path.toLowerCase().includes(queryLower)) {
        score += 20
      }

      // Score pour correspondance dans les mots-clés
      if (element.keywords.some(keyword => keyword.includes(queryLower))) {
        score += 15
      }

      // Score pour correspondance dans la catégorie
      if (element.category.toLowerCase().includes(queryLower)) {
        score += 10
      }

      // Score pour correspondance dans la description
      if (element.description?.toLowerCase().includes(queryLower)) {
        score += 5
      }

      return { ...element, score }
    })
    .filter((element) => element.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8) // Limiter à 8 résultats max

  return results
}
