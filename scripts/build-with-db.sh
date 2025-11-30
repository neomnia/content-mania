#!/bin/bash
set -e

echo "🔍 Vérification de l'environnement..."

# Vérifier si on est sur Vercel
if [ -n "$VERCEL" ]; then
  echo "✅ Build Vercel détecté"

  # Vérifier si DATABASE_URL est défini
  if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL configuré"
    echo ""
    echo "🗄️  Synchronisation du schéma de la base de données..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Exécuter la synchronisation du schéma
    pnpm db:push

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Schéma synchronisé avec succès"
    echo ""
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
