# Lago Billing Configuration

NeoSaaS uses [Lago](https://getlago.com/) for billing and invoicing. You can connect to either a self-hosted Lago instance or the Lago Cloud.

## Configuration

Navigate to **Business Dashboard > Settings > Payments** (`/admin/settings`).

### Environment Modes

You can switch between **Dev**, **Test**, and **Production** modes instantly via the 3-mode selector in the admin panel.

1.  **Dev Mode** (Purple): Lago is **completely bypassed**. Orders are created without any Lago API calls. Payment methods are hidden in checkout. Ideal for local development and testing the sales funnel.
2.  **Test Mode** (Orange): Uses the `Test API Key`. Invoices are created in Lago sandbox environment.
3.  **Production Mode** (Green): Uses the `Production API Key`. Real invoices are generated.

### Setup Steps

1.  **Lago API URL**:
    *   For Lago Cloud: `https://api.getlago.com/v1` (Default)
    *   For Self-Hosted: Enter your instance URL (e.g., `https://api.lago.yourdomain.com/v1`).

2.  **API Keys**:
    *   **Production API Key**: Enter your live API key from the Lago dashboard.
    *   **Test API Key**: Enter your test API key.

3.  **Enable Payments**:
    *   Toggle "Enable Payments" to activate the billing system globally.

## Integration Details

The system automatically selects the correct API key based on the selected mode in the database.

```typescript
// lib/lago.ts
export type LagoMode = 'production' | 'test' | 'dev';

const mode = (configMap['lago_mode'] || process.env.LAGO_MODE || 'dev') as LagoMode;

// In dev mode, Lago is completely disabled
if (mode === 'dev') {
  return { mode: 'dev', apiKey: null, apiUrl: '', isEnabled: false };
}

const apiKey = mode === 'test'
  ? (configMap['lago_api_key_test'] || process.env.LAGO_API_KEY_TEST)
  : (configMap['lago_api_key'] || process.env.LAGO_API_KEY);
```

### Dynamic Payment Methods

The checkout page dynamically shows/hides payment methods based on the configuration:

- **Dev Mode**: No payment methods shown, "Mode Developpement" message displayed
- **Test/Production**: Shows only enabled payment methods (Stripe, PayPal)

Payment methods are configured via toggles in Admin > Settings > Payments:
- `lago_stripe_enabled`: Enable/disable Stripe card payments
- `lago_paypal_enabled`: Enable/disable PayPal payments

## Troubleshooting

*   **Connection Failed**: Ensure your API URL is correct and accessible from the server.
*   **Invalid API Key**: Double-check that you haven't mixed up Test and Production keys.
*   **500 Error**: If you see a server error, check the application logs. It might be due to a missing API key for the selected mode.

## Customer Portal & Payment Methods

NeoSaaS integrates with Lago's **Customer Portal** to securely manage payment methods.

### How it works

1.  **View Payment Methods**: The user's payment methods are fetched directly from Lago and displayed in `Dashboard > Payments`.
2.  **Manage Cards**: When a user clicks "Manage Cards", the system generates a secure, temporary URL to the Lago Customer Portal.
3.  **Redirect**: The user is redirected to Lago's hosted portal where they can:
    *   Add new credit cards.
    *   Update existing cards.
    *   Set a default payment method.
    *   Delete cards.

### Implementation

*   **Frontend**: `app/(private)/dashboard/payments/page.tsx`
*   **Backend Actions**: `app/actions/payments.ts`
    *   `getPaymentMethods()`: Retrieves wallet and payment sources.
    *   `getCustomerPortalUrl()`: Generates the magic link for the portal.
    *   `getInvoices()`: Retrieves billing history.

This approach ensures PCI compliance as sensitive card data is never handled directly by the NeoSaaS application.
