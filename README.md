# 🚀 NEOSAAS

## Introduction
Welcome to the NEOSAAS project. NeoSaaS is a complete SaaS platform built with Next.js, designed for modern businesses.

## 🚀 Quick Start

Get started quickly with NeoSaaS:

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 📚 Documentation

Complete documentation is available in the **[docs/](./docs/)** directory:

- **[Quick Start Guide](./docs/guides/QUICK_START.md)** - Get started in minutes
- **[Authentication Setup](./docs/guides/AUTHENTICATION_SETUP.md)** - Setup authentication
- **[Database Setup](./docs/guides/AUTO_DATABASE_SETUP.md)** - Configure your database
- **[Troubleshooting](./docs/guides/TROUBLESHOOTING.md)** - Common issues and solutions

📖 **[View Full Documentation →](./docs/README.md)**

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Custom auth system with role-based access
- **Deployment**: Vercel

## 🏗️ Project Structure

```
neosaas-website/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── ui/                 # UI components (shadcn)
│   ├── layout/             # Layout components
│   ├── common/             # Shared components
│   └── features/           # Feature-specific components
├── lib/                    # Utilities and logic
├── db/                     # Database schema and config
├── styles/                 # Global styles
├── types/                  # TypeScript types
└── docs/                   # Documentation

```

## 📝 Note

Versions are dynamically loaded from `package.json`.