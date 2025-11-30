-- ===========================================================================
-- Tables pour la gestion des API (Scaleway, Resend, AWS SES, etc.)
-- À exécuter dans votre console Neon Database
-- ===========================================================================

-- Table principale pour stocker les configurations API (cryptées)
CREATE TABLE IF NOT EXISTS service_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  config JSONB NOT NULL,
  metadata JSONB,
  last_tested_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_service_api_configs_service_name ON service_api_configs(service_name);
CREATE INDEX IF NOT EXISTS idx_service_api_configs_environment ON service_api_configs(environment);
CREATE INDEX IF NOT EXISTS idx_service_api_configs_is_active ON service_api_configs(is_active);

-- Table pour tracker l'usage des API
CREATE TABLE IF NOT EXISTS service_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES service_api_configs(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  operation VARCHAR(255) NOT NULL,
  status TEXT NOT NULL,
  status_code VARCHAR(10),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  response_time INTEGER,
  cost_estimate INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_service_api_usage_config_id ON service_api_usage(config_id);
CREATE INDEX IF NOT EXISTS idx_service_api_usage_service_name ON service_api_usage(service_name);
CREATE INDEX IF NOT EXISTS idx_service_api_usage_created_at ON service_api_usage(created_at);

-- Vérification
SELECT 'service_api_configs table created' as status;
SELECT 'service_api_usage table created' as status;
