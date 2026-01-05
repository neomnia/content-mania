/**
 * Mode test pour Lago - Permet de tester le tunnel d'achat sans paiement réel
 * En mode test, les invoices sont simulées sans connexion au payment provider
 */

import { db } from '@/db'
import { platformConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { LagoTestModeResult } from './types'

interface LagoTestConfig {
  enabled: boolean
  mode: 'test' | 'production'
  autoMarkPaid: boolean // Auto-mark invoices as paid in test mode
}

/**
 * Récupère la configuration du mode test Lago
 */
export async function getLagoTestConfig(): Promise<LagoTestConfig> {
  const configs = await db.select().from(platformConfig).where(
    eq(platformConfig.key, 'lago_mode')
  )

  const mode = configs[0]?.value || 'production'

  // En mode test, on active les features de test
  const isTestMode = mode === 'test' || process.env.NODE_ENV === 'development'

  return {
    enabled: isTestMode,
    mode: mode as 'test' | 'production',
    autoMarkPaid: isTestMode // Auto-mark paid en dev/test
  }
}

/**
 * Génère un ID de facture simulé pour le mode test
 */
function generateTestInvoiceId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `test_inv_${timestamp}_${random}`
}

/**
 * Génère un numéro de facture simulé pour le mode test
 */
function generateTestInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `TEST-${year}${month}-${random}`
}

/**
 * Crée une facture simulée en mode test
 * Utilisé quand Lago n'est pas configuré ou en mode test
 */
export async function createTestInvoice(params: {
  customerId: string
  customerEmail: string
  customerName: string
  items: {
    description: string
    unitAmountCents: number
    quantity: number
  }[]
  currency: string
}): Promise<LagoTestModeResult> {
  const { items, currency } = params

  // Calculer le montant total
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.unitAmountCents * item.quantity)
  }, 0)

  const testConfig = await getLagoTestConfig()

  const result: LagoTestModeResult = {
    success: true,
    invoiceId: generateTestInvoiceId(),
    invoiceNumber: generateTestInvoiceNumber(),
    amount: totalAmount,
    currency: currency,
    status: testConfig.autoMarkPaid ? 'paid' : 'pending',
    testMode: true,
    message: testConfig.autoMarkPaid
      ? 'Mode test: Facture automatiquement marquée comme payée'
      : 'Mode test: Facture créée en attente de paiement simulé'
  }

  console.log('[Lago Test Mode] Invoice created:', {
    invoiceId: result.invoiceId,
    invoiceNumber: result.invoiceNumber,
    amount: `${(totalAmount / 100).toFixed(2)} ${currency}`,
    status: result.status,
    autoMarkPaid: testConfig.autoMarkPaid
  })

  return result
}

/**
 * Simule le paiement d'une facture en mode test
 */
export async function simulateTestPayment(invoiceId: string): Promise<{
  success: boolean
  transactionId: string
  paidAt: Date
}> {
  const testConfig = await getLagoTestConfig()

  if (!testConfig.enabled) {
    throw new Error('Test mode is not enabled')
  }

  const transactionId = `test_txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

  console.log('[Lago Test Mode] Payment simulated:', {
    invoiceId,
    transactionId,
    paidAt: new Date().toISOString()
  })

  return {
    success: true,
    transactionId,
    paidAt: new Date()
  }
}

/**
 * Vérifie si on doit utiliser le mode test
 */
export async function shouldUseTestMode(): Promise<boolean> {
  // Toujours utiliser test mode en développement si Lago n'est pas configuré
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const config = await getLagoTestConfig()
  return config.enabled
}

/**
 * Crée un client test simulé
 */
export async function createTestCustomer(params: {
  externalId: string
  email: string
  name: string
}): Promise<{
  lagoId: string
  externalId: string
}> {
  const lagoId = `test_cus_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

  console.log('[Lago Test Mode] Customer created:', {
    lagoId,
    externalId: params.externalId,
    email: params.email,
    name: params.name
  })

  return {
    lagoId,
    externalId: params.externalId
  }
}
