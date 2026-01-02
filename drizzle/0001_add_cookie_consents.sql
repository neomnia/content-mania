CREATE TABLE IF NOT EXISTS "cookie_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"consent_status" text NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
