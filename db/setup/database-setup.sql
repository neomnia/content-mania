-- NeoSaaS Database Schema Setup
-- Execute this SQL script in your Neon Database Console
-- https://console.neon.tech/

-- 1. Create the role enum type
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('admin', 'finance');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Type "role" already exists, skipping...';
END $$;

-- 2. Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);

-- 3. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    role role DEFAULT 'finance',
    is_saas_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_is_saas_admin ON users(is_saas_admin);

-- 4. Verify tables were created
SELECT
    'companies' as table_name,
    COUNT(*) as row_count
FROM companies
UNION ALL
SELECT
    'users' as table_name,
    COUNT(*) as row_count
FROM users;

-- 5. Check table structure
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('companies', 'users')
ORDER BY table_name, ordinal_position;
