/**
 * Utilitaires pour le formatage des prix de produits
 * Gère les 3 types de produits : standard, free, appointment
 */

export interface Product {
  type: 'standard' | 'free' | 'digital' | 'appointment'
  price: number // en centimes
  hourlyRate?: number | null // en centimes
  currency: string
}

/**
 * Formate le prix d'un produit selon son type
 * - Standard/Digital: Prix unitaire (ex: "99.00€")
 * - Free: "Gratuit"
 * - Appointment: Taux horaire (ex: "150€/h") ou "Sur devis"
 */
export function formatProductPrice(product: Product): string {
  const currencySymbol = product.currency === 'EUR' ? '€' : '$'
  
  switch (product.type) {
    case 'free':
      return 'Gratuit'
    
    case 'appointment':
      if (product.hourlyRate && product.hourlyRate > 0) {
        const hourlyAmount = (product.hourlyRate / 100).toFixed(2)
        return `${hourlyAmount}${currencySymbol}/h`
      }
      return 'Sur devis'
    
    case 'digital':
    case 'standard':
    default:
      const amount = (product.price / 100).toFixed(2)
      return `${amount}${currencySymbol}`
  }
}

/**
 * Obtient le prix numérique à afficher (évite les doublons)
 * Retourne null si le prix ne doit pas être affiché numériquement
 */
export function getProductDisplayPrice(product: Product): number | null {
  switch (product.type) {
    case 'free':
      return 0
    
    case 'appointment':
      // Pour les appointments, on retourne le taux horaire s'il existe
      return product.hourlyRate ? product.hourlyRate / 100 : null
    
    case 'digital':
    case 'standard':
    default:
      return product.price / 100
  }
}

/**
 * Vérifie si le produit a un prix valide à afficher
 */
export function hasValidPrice(product: Product): boolean {
  if (product.type === 'free') return true
  if (product.type === 'appointment') return !!product.hourlyRate
  return product.price > 0
}

/**
 * Obtient le label du prix (ex: "Prix", "Taux horaire", "Gratuit")
 */
export function getPriceLabel(product: Product): string {
  switch (product.type) {
    case 'free':
      return 'Gratuit'
    case 'appointment':
      return 'Taux horaire'
    case 'digital':
      return 'Prix digital'
    case 'standard':
    default:
      return 'Prix'
  }
}
