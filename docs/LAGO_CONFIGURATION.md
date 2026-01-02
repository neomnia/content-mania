# Lago Billing Configuration

NeoSaaS uses [Lago](https://getlago.com/) for billing and invoicing. You can connect to either a self-hosted Lago instance or the Lago Cloud.

## Configuration

Navigate to **Business Dashboard > Lago Parameters** (`/admin`).

### Environment Modes

You can switch between **Production** and **Test** modes instantly. This allows you to test your billing flow without affecting real data.

1.  **Production Mode**: Uses the `Production API Key`.
2.  **Test Mode**: Uses the `Test API Key`.

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
const mode = configMap['lago_mode'] || 'production';
const apiKey = mode === 'test' 
  ? configMap['lago_api_key_test']
  : configMap['lago_api_key'];
```

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
