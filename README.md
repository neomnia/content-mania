![Neosaas Logo](https://github-production-user-asset-6210df.s3.amazonaws.com/17944080/436394487-0f3b275c-a0da-4512-bfd1-4887ed773500.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20251126%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251126T162137Z&X-Amz-Expires=300&X-Amz-Signature=e4cbf330f148a9e34c25e4b5e52e7796d424263ef47385f1244e9430c1c61c8a&X-Amz-SignedHeaders=host)

# Neosaas

**Neosaas** is a ready-to-use SaaS template built on Next.js and APIs. A complete open-source framework designed to accelerate SaaS application creation. Just plug in any API and you're ready to go!

---

## 📦 Versions

| Component | Version |
|-----------|---------|
| **Neosaas** | `0.1.0` |
| **Next.js** | `16.0.1` |
| **React** | `^19` |
| **TypeScript** | `^5` |
| **Tailwind CSS** | `^3.4.17` |

*Versions are automatically extracted from `package.json`*

---

## 🚀 Key Features

- 📊 **Analytics** with [Vercel Analytics](https://vercel.com/analytics)
- 📩 **Email** via **Mailchimp**, **Resend**, or **SMTP**
- 🗂️ **File Storage** with **AWS S3**
- 💳 **Payments** integrated with **Stripe**, **PayPal**, or **FastSpring**
- 📚 **Documentation** generated with **Starlight** (based on [Astro.build](https://astro.build))
- ⏱️ **Scheduled Tasks** via `node-cron`
- ☁️ **Easy Deployment** on **[Vercel](https://vercel.com/)**, **[Railway](https://railway.app/)** or **[Fly.io](https://fly.io/)**
- 🗄️ **SQL Database** (PostgreSQL preferred with Prisma ORM)

---

## 🧱 Tech Stack

- **Next.js 16.0.1** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 3.4**
- **Radix UI Components**
- **PostgreSQL** (preferred database)
- **Prisma ORM** for database management
- **Next-Auth** for authentication
- **Zod** for validation
- **REST API / tRPC / GraphQL** support

---

## 📦 Integrated Applications

### 🎨 UI Components (Radix UI)
- `@radix-ui/react-accordion` - Expandable content sections
- `@radix-ui/react-alert-dialog` - Modal dialogs
- `@radix-ui/react-avatar` - User avatars
- `@radix-ui/react-checkbox` - Checkboxes
- `@radix-ui/react-dialog` - Dialog modals
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-navigation-menu` - Navigation menus
- `@radix-ui/react-popover` - Popovers
- `@radix-ui/react-select` - Select dropdowns
- `@radix-ui/react-slider` - Range sliders
- `@radix-ui/react-tabs` - Tab components
- `@radix-ui/react-toast` - Toast notifications
- `@radix-ui/react-tooltip` - Tooltips

### 📝 Forms & Validation
- `react-hook-form` (^7.54.1) - Form management
- `@hookform/resolvers` (^3.9.1) - Form validation resolvers
- `zod` (^3.24.1) - Schema validation

### 📊 Data Visualization
- `recharts` - Charting library
- `date-fns` (4.1.0) - Date manipulation
- `react-day-picker` (9.8.0) - Date picker

### 🎨 Styling & Icons
- `tailwindcss` (^3.4.17) - Utility-first CSS
- `tailwindcss-animate` (^1.0.7) - Animation utilities
- `lucide-react` (^0.454.0) - Icon library
- `class-variance-authority` (^0.7.1) - CSS variant utilities
- `tailwind-merge` (^2.5.5) - Tailwind class merging

### 🛠️ Utilities
- `cmdk` (1.0.4) - Command menu
- `embla-carousel-react` (8.5.1) - Carousel component
- `input-otp` (1.4.1) - OTP input
- `sonner` (^1.7.1) - Toast notifications
- `react-resizable-panels` (^2.1.7) - Resizable panels
- `next-themes` - Theme management (dark/light mode)

### 📈 Analytics & Fonts
- `@vercel/analytics` (1.3.1) - Vercel Analytics integration
- `geist` (^1.3.1) - Geist font family

---

## 🗄️ Database: SQL (PostgreSQL)

Neosaas uses **PostgreSQL** as the preferred database solution, managed through **Prisma ORM**.

### Why PostgreSQL?
- ✅ Robust and reliable
- ✅ Perfect for relational data
- ✅ Native JSON support
- ✅ Excellent performance
- ✅ Free hosting on Vercel, Railway, Supabase

### Database Setup
```bash
# Install Prisma (if not already included)
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init

# Create migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

---

## 🛠️ Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/neosaastech/neosaas-website.git
cd neosaas-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file from `.env.example`:

```bash
cp .env.example .env.local
```

Set up the following API keys:
- `DATABASE_URL` (PostgreSQL connection string)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `RESEND_API_KEY`, etc.

### 4. Run the project

```bash
npm run dev
```

Access the application at: [http://localhost:3000](http://localhost:3000)

---

## 🔌 API Integration

Neosaas is designed to work seamlessly with any API:

### REST API
```typescript
// app/api/example/route.ts
export async function GET() {
  const data = await fetch('https://your-api.com/endpoint');
  return Response.json(data);
}
```

### GraphQL
```typescript
import { ApolloClient, InMemoryCache } from '@apollo/client';
const client = new ApolloClient({
  uri: 'https://your-graphql-api.com',
  cache: new InMemoryCache(),
});
```

### tRPC
```typescript
// Already configured for type-safe API calls
import { trpc } from '@/lib/trpc';
const data = await trpc.example.query();
```

---

## 🧪 Development

- API routes are in `app/api/`
- Example dashboard is in `app/dashboard-example`
- Documentation is generated in `/docs` with Astro + Starlight
- Scheduled tasks are in `lib/cron.ts`
- Add your products in `/products`

### Useful Commands

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

---

## 🧭 Deployment

### Recommended: Vercel (Optimized for Next.js)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/neosaastech/neosaas-website)

**Why Vercel?**
- ✅ Native Next.js 16 support
- ✅ Automatic deployments from Git
- ✅ Built-in analytics
- ✅ PostgreSQL database included
- ✅ Edge functions and serverless
- ✅ Free SSL certificates

### Alternative Platforms

- [Railway](https://railway.app/) - Database, storage, Node.js hosting
- [Fly.io](https://fly.io/) - High performance with minimal configuration
- **Docker** - For custom deployments

---

## 📝 License

This project is licensed under the **MIT License**. You are free to modify, use, and redistribute it as you wish.

See [`LICENSE`](./LICENSE) for more information.

---

## 🤝 Contributing

Want to contribute? Fork the project, create a branch, and submit a **pull request** 🙌

---

## 📫 Contact

Project maintained by [@neoweb2212](https://github.com/neoweb2212)

---

> Neosaas — Build your SaaS like a pro, without starting from scratch.