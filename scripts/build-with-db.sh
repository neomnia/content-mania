#!/bin/bash
set -e

echo "🔍 Vérification de l'environnement..."

# Vérifier si on est sur Vercel
if [ -n "$VERCEL" ]; then
  echo "✅ Build Vercel détecté (Env: ${VERCEL_ENV:-unknown})"

  # Vérifier si DATABASE_URL est défini
  if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL configuré"
    echo ""
    
    # Auto-enable FORCE_DB_RESET for preview/dev if not explicitly set
    if [ -z "$FORCE_DB_RESET" ]; then
      if [ "$VERCEL_ENV" = "preview" ] || [ "$VERCEL_ENV" = "development" ]; then
        echo "⚠️ Environnement de test détecté ($VERCEL_ENV) : Activation automatique de FORCE_DB_RESET"
        export FORCE_DB_RESET="true"
      fi
    fi
    
    if [ "$FORCE_DB_RESET" = "true" ]; then
      echo "⚠️ FORCE_DB_RESET activé : Réinitialisation complète de la base de données..."
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      pnpm db:hard-reset
    else
      echo "🛡️ Mode Persistant : Mise à jour du schéma uniquement (db:push)..."
      echo "ℹ️ Pour réinitialiser la base, définissez la variable d'environnement FORCE_DB_RESET=true"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      pnpm db:push
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Base de données réinitialisée et synchronisée avec succès"
    echo ""

    echo "🌱 Initialisation des templates d'email..."
    pnpm seed:email-templates
    echo "✅ Templates d'email initialisés"
    echo ""

    # Add delay to allow database connections to close properly
    echo "⏳ Attente de la fermeture des connexions..."
    sleep 3

    echo "🔐 Initialisation des permissions de pages..."
    # Run seed:pages but don't fail the build if it fails (pages can be synced later)
    if pnpm seed:pages; then
      echo "✅ Permissions de pages initialisées"
    else
      echo "⚠️  Synchronisation des pages échouée (non bloquant)"
      echo "   Les pages peuvent être synchronisées manuellement plus tard"
    fi
    echo ""

    # Correction des configurations email pour les environnements de prévisualisation/dev
    if [ "$VERCEL_ENV" = "preview" ] || [ "$VERCEL_ENV" = "development" ]; then
        echo "🔧 Correction des configurations email (Preview/Dev)..."
        npx tsx scripts/fix-email-provider-defaults.ts
        echo "✅ Configurations email corrigées"
        echo ""
    fi
  else
    echo "⚠️  DATABASE_URL non défini - synchronisation ignorée"
    echo "   Les tables ne seront pas créées automatiquement"
    echo ""
  fi
else
  echo "ℹ️  Build local détecté - synchronisation ignorée"
  echo "   Utilisez 'pnpm db:push' manuellement si nécessaire"
  echo ""
fi

echo "🏗️  Compilation de Next.js..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm exec next build
