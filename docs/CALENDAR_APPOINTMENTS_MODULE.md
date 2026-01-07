# Calendar & Appointments Module

## Overview

The Calendar & Appointments module provides a comprehensive appointment booking system integrated with external calendar services (Google Calendar, Microsoft Outlook) and the Lago billing system for paid appointments.

## Features

- **Appointment Management**: Create, update, and manage appointments (free and paid)
- **Calendar View**: Visual calendar interface with react-big-calendar
- **External Calendar Sync**: Bidirectional sync with Google Calendar and Microsoft Outlook
- **Payment Integration**: Lago integration for paid appointments
- **Availability Management**: Define available time slots and exceptions
- **GDPR Compliant**: Secure token storage with encryption

## Database Schema

### Tables

#### `appointments`
Main table for storing appointments.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Owner of the appointment |
| productId | UUID | Optional link to appointment product |
| title | TEXT | Appointment title |
| description | TEXT | Optional description |
| location | TEXT | Physical location |
| meetingUrl | TEXT | Virtual meeting link |
| startTime | TIMESTAMP | Start date/time |
| endTime | TIMESTAMP | End date/time |
| timezone | TEXT | Timezone (default: Europe/Paris) |
| status | TEXT | pending, confirmed, cancelled, completed, no_show |
| type | TEXT | free or paid |
| price | INTEGER | Price in cents |
| currency | TEXT | Currency code (EUR, USD, etc.) |
| isPaid | BOOLEAN | Payment status |
| lagoInvoiceId | TEXT | Lago invoice ID |
| googleEventId | TEXT | Google Calendar event ID |
| microsoftEventId | TEXT | Microsoft Outlook event ID |
| attendeeEmail | TEXT | External attendee email |
| attendeeName | TEXT | External attendee name |
| attendeePhone | TEXT | External attendee phone |
| notes | TEXT | Internal notes |

#### `calendarConnections`
Stores OAuth tokens for external calendar services.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User who connected the calendar |
| provider | TEXT | google or microsoft |
| email | TEXT | Calendar account email |
| accessToken | TEXT | Encrypted access token |
| refreshToken | TEXT | Encrypted refresh token |
| expiresAt | TIMESTAMP | Token expiration |
| calendarId | TEXT | Primary calendar ID |
| isActive | BOOLEAN | Connection status |
| lastSyncAt | TIMESTAMP | Last sync timestamp |

#### `appointmentSlots`
Define available time slots for booking.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Owner |
| productId | UUID | Optional product-specific slot |
| dayOfWeek | INTEGER | 0 (Sunday) to 6 (Saturday) |
| startTime | TEXT | Start time (HH:mm format) |
| endTime | TEXT | End time (HH:mm format) |
| duration | INTEGER | Duration in minutes |
| bufferBefore | INTEGER | Buffer before appointment |
| bufferAfter | INTEGER | Buffer after appointment |
| maxAppointments | INTEGER | Max concurrent appointments |
| isActive | BOOLEAN | Slot active status |

#### `appointmentExceptions`
Override availability for specific dates.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Owner |
| date | TIMESTAMP | Specific date |
| isAvailable | BOOLEAN | false = blocked, true = extra availability |
| startTime | TEXT | Override start time |
| endTime | TEXT | Override end time |
| reason | TEXT | e.g., "Vacation", "Holiday" |

## API Endpoints

### Appointments

#### GET /api/appointments
List appointments for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (pending, confirmed, etc.)
- `type`: Filter by type (free, paid)
- `startDate`: Filter from date (ISO string)
- `endDate`: Filter to date (ISO string)
- `limit`: Maximum results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Consultation",
      "startTime": "2024-01-15T10:00:00Z",
      "endTime": "2024-01-15T11:00:00Z",
      "status": "confirmed",
      "type": "paid",
      "price": 5000,
      "isPaid": true
    }
  ]
}
```

#### POST /api/appointments
Create a new appointment.

**Body:**
```json
{
  "title": "Consultation initiale",
  "description": "Description optionnelle",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "timezone": "Europe/Paris",
  "type": "paid",
  "price": 5000,
  "currency": "EUR",
  "attendeeEmail": "client@example.com",
  "attendeeName": "Jean Dupont",
  "syncToCalendar": true
}
```

#### GET /api/appointments/[id]
Get a single appointment.

#### PUT /api/appointments/[id]
Update an appointment.

#### DELETE /api/appointments/[id]
Delete an appointment.

### Payment

#### POST /api/appointments/[id]/pay
Initiate payment for a paid appointment via Lago.

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceId": "lago_invoice_id",
    "invoiceNumber": "INV-2024-001",
    "amount": 5000,
    "currency": "EUR",
    "status": "draft"
  }
}
```

### Calendar Connections

#### GET /api/calendar
List connected calendars.

#### GET /api/calendar/connect?provider=google|microsoft
Get OAuth authorization URL.

#### DELETE /api/calendar?id=connection_id
Disconnect a calendar.

## Environment Variables

### Required for Google Calendar

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/callback/google
```

### Required for Microsoft Outlook

```env
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/calendar/callback/microsoft
```

### OAuth Setup

#### Google Calendar

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://yourdomain.com/api/calendar/callback/google`
6. Copy Client ID and Client Secret

#### Microsoft Outlook

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create a new registration
4. Add redirect URI: `https://yourdomain.com/api/calendar/callback/microsoft`
5. Create a client secret
6. Add API permissions:
   - `Calendars.ReadWrite`
   - `User.Read`
   - `offline_access`

## Frontend Pages

### Client Dashboard Routes

Routes accessible to all authenticated users for managing their own appointments.

| Route | Description |
|-------|-------------|
| `/dashboard/appointments` | List view of appointments with search and filters |
| `/dashboard/appointments/new` | Create new appointment |
| `/dashboard/appointments/[id]` | Appointment details |
| `/dashboard/calendar` | Calendar view (react-big-calendar) |
| `/dashboard/calendar/settings` | Calendar connections (Google/Microsoft) |
| `/dashboard/support` | Help center & FAQ |

### Appointments List Page (`/dashboard/appointments`)

Full-featured list view of appointments with:

**Search & Filters:**
- Search by title, attendee name, email, or description
- Filter by status: pending, confirmed, completed, cancelled, no_show
- Filter by type: free, paid

**Display:**
- Appointments grouped by date
- Each appointment card shows:
  - Time range (start - end)
  - Title and status badge
  - Payment status (for paid appointments)
  - Attendee name
  - Location or video call indicator
- Click to navigate to appointment details

**Navigation:**
- "Calendrier" button → `/dashboard/calendar`
- "Nouveau" button → `/dashboard/appointments/new`

### Appointment Request Page (`/dashboard/appointments/new`)

Client-side appointment request form. This is a **request** that must be validated by admin.

**Form Fields:**
- **Title** (required): Subject of the appointment request
- **Description**: Detailed explanation of the appointment purpose
- **Preferred Date/Time** (required): Client's preferred time slot
- **Timezone**: Client's timezone
- **Location** (optional): Physical address or video conference link
- **Notes**: Additional information for the admin

**Automatic Behavior:**
- Type is always set to `free` (admin can change to `paid` if needed)
- Status is always set to `pending` (waiting for admin confirmation)
- No payment options shown to client
- No attendee information required (admin manages this)

**User Flow:**
1. Client fills the request form
2. System creates appointment with `status: pending`, `type: free`
3. Admin receives notification in chat
4. Admin reviews, configures payment if needed, and confirms/rejects
5. Client is notified of the decision

### Admin Routes

Routes accessible only to administrators for managing all appointments across the platform.

| Route | Description |
|-------|-------------|
| `/admin/appointments` | Admin appointments management |

### Admin API Endpoints

#### GET /api/admin/appointments
List all appointments across all users (admin only).

**Query Parameters:**
- `status`: Filter by status
- `type`: Filter by type
- `startDate`: Filter from date
- `endDate`: Filter to date
- `limit`: Maximum results (default: 100)

**Response includes user information:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Consultation",
      "user": {
        "id": "user_uuid",
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com"
      },
      "product": { ... },
      "status": "confirmed",
      "startTime": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/admin/appointments (action: stats)
Get appointment statistics for the current month.

**Request Body:**
```json
{
  "action": "stats"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "pending": 5,
    "confirmed": 20,
    "completed": 15,
    "cancelled": 3,
    "noShow": 2,
    "paidAppointments": 30,
    "unpaidAppointments": 5,
    "totalRevenue": 150000,
    "unpaidAmount": 25000
  }
}
```

## Support Page

The client dashboard includes a Support/Help Center page (`/dashboard/support`) with:

### Features
- **FAQ Section**: Accordion-based frequently asked questions in French
- **Quick Actions**:
  - Documentation link
  - Live chat button
  - Email contact (support@neosaas.com)
- **Contact Form**: Submit support tickets with category selection
- **Tips Section**: Helpful guidance for users

### Categories for Support Tickets
- Question générale (General question)
- Facturation / Paiement (Billing/Payment)
- Rendez-vous (Appointments)
- Problème technique (Technical issue)
- Mon compte (Account)
- Autre (Other)

## Navigation Structure

### Client Sidebar (navItems)
```typescript
const navItems = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Appointments", href: "/dashboard/appointments", icon: CalendarDays },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Company Management", href: "/dashboard/company-management", icon: Building2 },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Support", href: "/dashboard/support", icon: HelpCircle },
]
```

### Admin Sidebar (adminItems)
```typescript
const adminItems = [
  { name: "Dashboard", href: "/admin", icon: Shield },
  { name: "Appointments", href: "/admin/appointments", icon: CalendarDays },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Organization", href: "/admin/users", icon: Users },
  { name: "Parameters", href: "/admin/settings", icon: Settings },
  { name: "API Management", href: "/admin/api", icon: Key },
  { name: "Mail Management", href: "/admin/mail", icon: Mail },
  { name: "Legal & Compliance", href: "/admin/legal", icon: FileText },
]
```

## Server Actions

Located in `app/actions/appointments.ts`:

- `getAppointments()` - Fetch appointments
- `getAppointmentById()` - Get single appointment
- `createAppointment()` - Create appointment
- `updateAppointment()` - Update appointment
- `cancelAppointment()` - Cancel appointment
- `confirmAppointment()` - Confirm appointment
- `completeAppointment()` - Mark as completed
- `deleteAppointment()` - Delete appointment
- `getAppointmentSlots()` - Get availability slots
- `upsertAppointmentSlot()` - Create/update slot
- `getAppointmentExceptions()` - Get exceptions
- `createAppointmentException()` - Create exception
- `getCalendarConnections()` - Get connected calendars
- `getAppointmentStats()` - Get statistics
- `getPublicAvailableSlots()` - Get available slots (for booking)

## Calendar Sync Utilities

Located in `lib/calendar/`:

### Google Calendar (`google.ts`)

- `getGoogleAuthUrl()` - Generate OAuth URL
- `exchangeGoogleCode()` - Exchange code for tokens
- `refreshGoogleToken()` - Refresh access token
- `createGoogleEvent()` - Create calendar event
- `updateGoogleEvent()` - Update calendar event
- `deleteGoogleEvent()` - Delete calendar event
- `getGoogleEvents()` - Fetch calendar events

### Microsoft Outlook (`microsoft.ts`)

- `getMicrosoftAuthUrl()` - Generate OAuth URL
- `exchangeMicrosoftCode()` - Exchange code for tokens
- `refreshMicrosoftToken()` - Refresh access token
- `createMicrosoftEvent()` - Create calendar event
- `updateMicrosoftEvent()` - Update calendar event
- `deleteMicrosoftEvent()` - Delete calendar event
- `getMicrosoftEvents()` - Fetch calendar events

### Sync Service (`sync.ts`)

- `getValidAccessToken()` - Get valid token (auto-refresh)
- `syncAppointmentToCalendars()` - Sync to external calendars
- `deleteAppointmentFromCalendars()` - Delete from external calendars
- `storeCalendarConnection()` - Store OAuth connection
- `disconnectCalendar()` - Remove connection

## Security

### Token Encryption

All OAuth tokens are encrypted using AES-256-GCM before storage:

```typescript
import { encrypt, decrypt } from '@/lib/email/utils/encryption'

// Encrypt before storing
const encryptedToken = await encrypt(accessToken)

// Decrypt when needed
const accessToken = await decrypt(encryptedToken)
```

### State Parameter

OAuth flows use encrypted state parameters to prevent CSRF attacks:

```typescript
const stateData = JSON.stringify({
  userId: user.userId,
  timestamp: Date.now(),
})
const state = await encrypt(stateData)
```

## Lago Integration

Paid appointments integrate with Lago for invoicing:

1. User creates a paid appointment
2. User clicks "Create Invoice"
3. System calls Lago API to create invoice
4. Invoice ID stored in appointment
5. Payment status updated on webhook

### Webhook Handler

The Lago webhook at `/api/lago-webhook` handles payment confirmations and updates the appointment payment status.

## Testing

### Create a Test Appointment

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=your_token" \
  -d '{
    "title": "Test Appointment",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "type": "free"
  }'
```

### Test Calendar Connection

1. Navigate to `/dashboard/calendar/settings`
2. Click "Connect" for Google or Microsoft
3. Complete OAuth flow
4. Verify connection appears as active

## Dependencies

```bash
npm install react-big-calendar date-fns googleapis @azure/msal-react
```

Note: `googleapis` is optional if only using fetch-based implementation.

## Troubleshooting

### OAuth Errors

- **state_expired**: User took too long, restart OAuth flow
- **invalid_state**: State verification failed, check encryption
- **access_denied**: User denied permissions

### Sync Issues

- Check token expiration and refresh logic
- Verify calendar permissions
- Check API rate limits

### Payment Issues

- Verify Lago API key configuration
- Check customer exists in Lago
- Review webhook configuration
