"use server"

import { getDashboardStats } from "@/lib/data/admin-dashboard"
import { getAllPayments } from "@/lib/data/payments"
import { getAllInvoices } from "@/lib/data/invoices"
import { requireAdmin } from "@/lib/auth/server"

export async function fetchAdminDashboardStats() {
  // Verify admin access
  await requireAdmin()
  
  return await getDashboardStats()
}

export async function fetchAdminPayments() {
  await requireAdmin()
  return await getAllPayments()
}

export async function fetchAdminInvoices() {
  await requireAdmin()
  return await getAllInvoices()
}
