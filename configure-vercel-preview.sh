#!/bin/bash
set -e

# ============================================
# Configuration Vercel Preview - À exécuter localement
# ============================================

VERCEL_TOKEN="bhZ8gqnYVOQhQkPdvidmdWuq"
TEAM_ID="team_CcA0AyPtSPVhRijEsDRmyjpa"
PROJECT_NAME="neosaas-website"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Configuration Vercel Preview Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test du token
echo "🔍 Vérification du token..."
user_response=$(curl -s "https://api.vercel.com/v2/user" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

if echo "$user_response" | jq -e '.user' >/dev/null 2>&1; then
    username=$(echo "$user_response" | jq -r '.user.username // .user.email')
    echo "✅ Token valide - Connecté en tant que: $username"
else
    echo "❌ Token invalide ou expiré"
    echo "$user_response"
    echo ""
    echo "📝 Créez un nouveau token sur: https://vercel.com/account/tokens"
    echo "   Scope: Full Account | Expiration: 30 days"
    exit 1
fi

echo ""
echo "🔍 Récupération du projet '$PROJECT_NAME'..."

# Essayer avec le team ID
project_response=$(curl -s "https://api.vercel.com/v9/projects/$PROJECT_NAME?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

PROJECT_ID=$(echo "$project_response" | jq -r '.id // empty')

# Si pas trouvé, essayer sans team ID
if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  Tentative sans teamId..."
    project_response=$(curl -s "https://api.vercel.com/v9/projects/$PROJECT_NAME" \
      -H "Authorization: Bearer $VERCEL_TOKEN")
    PROJECT_ID=$(echo "$project_response" | jq -r '.id // empty')
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Projet introuvable"
    echo "$project_response" | jq '.'
    exit 1
fi

echo "✅ Projet trouvé: $PROJECT_ID"
echo "   Nom: $(echo "$project_response" | jq -r '.name')"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Configuration des variables d'environnement"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Fonction pour ajouter une variable
add_env_var() {
    local key=$1
    local value=$2

    echo "📝 Configuration de $key pour Preview..."

    response=$(curl -s -w "\n%{http_code}" -X POST \
      "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"key\": \"$key\",
        \"value\": \"$value\",
        \"type\": \"encrypted\",
        \"target\": [\"preview\"]
      }")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "   ✅ $key configuré avec succès"
        return 0
    fi

    # Vérifier si la variable existe déjà
    error_code=$(echo "$body" | jq -r '.error.code // empty')
    if [ "$error_code" = "ENV_ALREADY_EXISTS" ]; then
        echo "   ℹ️  $key existe déjà - Mise à jour..."

        # Obtenir l'ID de la variable
        env_id=$(curl -s "https://api.vercel.com/v9/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
          -H "Authorization: Bearer $VERCEL_TOKEN" | jq -r ".envs[] | select(.key==\"$key\") | .id" | head -1)

        if [ -n "$env_id" ] && [ "$env_id" != "null" ]; then
            # Mettre à jour
            curl -s -X PATCH \
              "https://api.vercel.com/v9/projects/$PROJECT_ID/env/$env_id?teamId=$TEAM_ID" \
              -H "Authorization: Bearer $VERCEL_TOKEN" \
              -H "Content-Type: application/json" \
              -d "{
                \"value\": \"$value\",
                \"target\": [\"preview\"]
              }" >/dev/null
            echo "   ✅ $key mis à jour"
        fi
        return 0
    fi

    echo "   ⚠️  Erreur HTTP: $http_code"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    return 1
}

# 1. DATABASE_URL
echo "1️⃣  DATABASE_URL"
add_env_var "DATABASE_URL" \
  "postgresql://neondb_owner:npg_cRzIrOmJwo38@ep-calm-lab-agkv7stu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
echo ""

# 2. NEXTAUTH_SECRET
echo "2️⃣  NEXTAUTH_SECRET"
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "   Clé générée: ${NEXTAUTH_SECRET:0:20}..."
add_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
echo ""

# 3. ADMIN_SECRET_KEY
echo "3️⃣  ADMIN_SECRET_KEY"
add_env_var "ADMIN_SECRET_KEY" "change-this-in-production"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration terminée avec succès !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Prochaines étapes :"
echo ""
echo "1️⃣  Attendez le redéploiement automatique (~2 minutes)"
echo ""
echo "2️⃣  Trouvez votre URL Preview :"
echo "   - GitHub: Pull Request → Checks → Vercel → Details"
echo "   - Format: neosaas-website-git-[branch]-[team].vercel.app"
echo ""
echo "3️⃣  Vérifiez les variables :"
echo "   curl https://[preview-url]/api/debug/env"
echo ""
echo "4️⃣  Initialisez la base de données :"
echo "   curl -X POST https://[preview-url]/api/setup \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"secretKey\":\"change-this-in-production\"}'"
echo ""
echo "5️⃣  Testez l'inscription :"
echo "   Ouvrez: https://[preview-url]/auth/register"
echo ""
