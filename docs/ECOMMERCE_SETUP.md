# E-Commerce Plugin Setup

This module adds e-commerce capabilities to the Content Mania application, allowing you to sell products and services directly from the dashboard.

## Features

- **Product Management**: Create, edit, and publish products via the Admin Panel.
- **Product Types**: Support for **Digital Products** (file downloads) and **Appointments** (Outlook integration).
- **Rich Product Details**: Add subtitles, detailed descriptions, and feature checklists.
- **Dynamic Storefront**: The Dashboard (`/dashboard`) automatically lists all published products.
- **Checkout Flow**: A dedicated checkout page (`/dashboard/checkout`) handles order processing without redundant user data entry.
- **Cart System**: Real-time cart notifications in the header.
- **Database Integration**: Full schema for Products, Carts, Orders, and Outlook Integrations.

## Getting Started

### 1. Database Migration

Ensure you have pushed the new schema to your database:

```bash
pnpm db:push
```

### 2. Admin Configuration

1.  Navigate to `/admin/products`.
2.  **Inline Editing**: You can now edit products directly from the table.
    *   Click the **Pencil Icon** (Quick Edit) on any row.
    *   Modify Title, Type, Price, Status, and **Icon**.
    *   Click the **Check Mark** to save.
3.  **Adding/Editing Products (Full Form)**:
    *   Click "Add Product" or the product title to open the full form.
    *   **Icon**: Select a visual icon (ShoppingBag, Package, Zap, etc.).
    *   **Features**:
        *   **Focus Areas**: Enter key topics or features (one per line).
        *   **Deliverables**: Enter what the user receives (one per line).
        *   These will be displayed in separate sections on the pricing card.

### 3. Dashboard & Checkout

*   Users will see published products on their main dashboard (`/dashboard`).
*   The dedicated marketplace page (`/dashboard/marketplace`) has been removed in favor of direct dashboard integration.
*   Clicking "Purchase Now" adds the item to the **Server-Side Cart** and redirects to checkout.
*   The checkout flow (`/dashboard/checkout`) automatically loads the active cart.

## Lago Billing Integration

We support dual-mode configuration for Lago (Billing Engine).

*   **Configuration**: Go to `/admin` -> **Lago Parameters**.
*   **Modes**: Switch between **Test** and **Production** environments.
*   **Keys**: Store separate API keys for each environment.
*   **Documentation**: See `docs/LAGO_CONFIGURATION.md` for full details.

## Admin Alerts System

A new alert system has been integrated into the Admin Panel (`/admin`) to notify administrators of critical configuration issues:
*   **Email Configuration**: Warns if no email provider is active.
*   **Profile Completeness**: Warns if the admin profile is missing name or contact details.
*   **Contact Info**: Warns if the phone number is missing (crucial for business operations).

## Future Integrations

### Outlook Calendar
To enable real Outlook booking integration:
1.  Configure `outlookIntegrations` table with your tenant details.
2.  Update `app/actions/ecommerce.ts` to use the Microsoft Graph API.

### Lago Billing
To enable Lago invoicing:
1.  Install the Lago SDK.
2.  Update the `createOrder` action to trigger a Lago invoice creation upon successful payment.
