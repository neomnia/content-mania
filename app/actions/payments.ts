'use server'

import { getLagoClient } from "@/lib/lago"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getPaymentMethods() {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const lago = await getLagoClient()
    
    // Fetch customer details from Lago
    // We use the user.id as the external_id in Lago
    try {
      const result = await lago.customers.getCustomer(user.id)
      
      // Lago returns customer details. 
      // Payment methods are usually handled by the payment provider (Stripe/GoCardless) linked to Lago.
      // Lago stores the "billing_configuration" which indicates the provider.
      
      // We can't easily list all cards from Lago API directly as it abstracts the provider.
      // However, we can check if there is a valid payment provider linked.
      
      const customer = result.data.customer
      
      // Return an array to match frontend expectation. 
      // If we had card details, we would map them here.
      // For now, we rely on the Portal for viewing details, but we can return the customer object in an array
      // if we want to show some basic info, or just an empty array to force "Manage Cards" usage.
      
      // Let's return an empty array for now to avoid displaying incorrect card info,
      // as the Portal is the best place to view/edit them.
      return { success: true, data: [] }
    } catch (e: any) {
      if (e.response?.status === 404) {
        return { success: true, data: [] } // Customer not found in Lago
      }
      throw e
    }
  } catch (error) {
    console.error("Failed to fetch payment methods:", error)
    return { success: false, error: "Failed to fetch payment methods" }
  }
}

export async function getCustomerPortalUrl() {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const lago = await getLagoClient()
    
    // Ensure customer exists in Lago before asking for portal URL
    // If customer doesn't exist, create them first
    try {
      await lago.customers.getCustomer(user.id)
    } catch (e: any) {
      if (e.response?.status === 404) {
        // Create customer if not found
        await lago.customers.create({
          customer: {
            external_id: user.id,
            name: user.name || user.email,
            email: user.email,
            currency: "USD", // Default currency, should be configurable
          }
        })
      } else {
        throw e
      }
    }

    // Generate a portal URL for the customer to manage their payment methods
    const result = await lago.customers.getPortalUrl(user.id)
    
    return { success: true, url: result.data.customer.portal_url }
  } catch (error) {
    console.error("Failed to get portal URL:", error)
    return { success: false, error: "Failed to get portal URL" }
  }
}

export async function getInvoices() {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const lago = await getLagoClient()
    
    const result = await lago.invoices.findAll({
      external_customer_id: user.id,
      per_page: 10,
      page: 1
    })
    
    return { success: true, data: result.data.invoices }
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return { success: false, error: "Failed to fetch invoices" }
  }
}
