# **NeoSaaS** 🚀
*Un template open-source prêt à l'emploi pour développer votre SaaS.*

**Version :** `0.9.1 (Bêta)`
**Statut :** En développement actif
**Licence :** [MIT](LICENSE)
**Documentation :** [Lire la documentation](https://docs.neosaas.com)
**Téléchargement :** [Lien vers l'application](https://neosaas.com/download)

---

## **📌 Description**
NeoSaaS est un **template open-source** conçu pour accélérer le développement de ton application SaaS. Il intègre une architecture modulaire basée sur **Docker** et **GitHub Actions** pour un déploiement automatisé et une scalabilité immédiate.

---

## **⚙️ Prérequis**
- **Docker** (version 20.10 ou supérieure)
- **GitHub CLI** (`gh`) pour interagir avec GitHub Container Registry (GHCR)
- Un **compte GitHub** avec accès au dépôt [neosaastech/neosaas-website](https://github.com/neosaastech/neosaas-website)

---

## **🛠 Installation et lancement avec Docker**

### **1. Récupérer l'image Docker depuis GitHub**
Les images Docker sont automatiquement construites et poussées vers **GitHub Container Registry (GHCR)** via GitHub Actions. Voici comment les utiliser :

#### **Nom de l'image**
L'image est nommée selon le workflow GitHub Actions :
- **Nom complet** : `ghcr.io/neosaastech/neosaas-website/web`
- **Tags disponibles** :
  - `development` (pour la branche `Development`)
  - `sha-<shortsha>` (ex: `sha-abcdef1`)

#### **Authentification avec GHCR**
Avant de récupérer l'image, authentifie-toi avec GitHub Container Registry :
```bash
echo "<TON_TOKEN_GITHUB>" | docker login ghcr.io -u <TON_USERNAME> --password-stdin
```
> Remplace `<TON_TOKEN_GITHUB>` par un [token GitHub](https://github.com/settings/tokens) avec les permissions `read:packages`.

#### **Récupérer et lancer l'image**
Pour utiliser l'image de la branche `Development` :
```bash
# Récupérer l'image
docker pull ghcr.io/neosaastech/neosaas-website/web:development

# Lancer le conteneur
docker run -d -p 3000:3000 --name neosaas ghcr.io/neosaastech/neosaas-website/web:development
```

Pour utiliser une version spécifique (ex: `sha-abcdef1`) :
```bash
docker pull ghcr.io/neosaastech/neosaas-website/web:sha-abcdef1
docker run -d -p 3000:3000 --name neosaas ghcr.io/neosaastech/neosaas-website/web:sha-abcdef1
```

---

### **2. Utiliser Docker Compose**
Si tu préfères utiliser `docker-compose`, crée un fichier `docker-compose.yml` :
```yaml
version: "3.9"
services:
  neosaas:
    image: ghcr.io/neosaastech/neosaas-website/web:development
    container_name: neosaas
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
```

Puis lance le service :
```bash
docker-compose up -d
```

---

### **3. Mettre à jour l'image**
Pour récupérer la dernière version de l'image :
```bash
# Arrêter et supprimer l'ancien conteneur
docker stop neosaas && docker rm neosaas

# Récupérer la nouvelle image
docker pull ghcr.io/neosaastech/neosaas-website/web:development

# Relancer le conteneur
docker run -d -p 3000:3000 --name neosaas ghcr.io/neosaastech/neosaas-website/web:development
```

---

## **📂 Structure du projet**
```
neosaas/
├── docker/                  # Fichiers de configuration Docker
├── src/
│   ├── vente/               # Module "Vente" (à venir)
│   ├── contenu/             # Module "Contenu" (blog, pages statiques)
│   └── core/                # Cœur de l'application (API, auth, etc.)
├── docs/                    # Documentation technique
├── .github/workflows/       # Workflows GitHub Actions
└── README.md
```

---

## **🚀 Fonctionnalités clés**
| Module       | Statut       | Description                          |
|--------------|-------------|--------------------------------------|
| **Authentification** | ✅ Disponible | Système d'authentification intégré (JWT/OAuth). |
| **Blog**      | ✅ Disponible | Gestion de contenu avec Markdown.   |
| **Vente**     | ⏳ À venir   | Module e-commerce (Stripe/PayPal).  |
| **API**       | ✅ Disponible | RESTful API pour les interactions.   |
| **Dashboard** | ✅ Disponible | Tableau de bord administrateur.      |

---

## **🤝 Contribuer**
Les contributions sont les bienvenues ! Voici comment participer :
1. **Forker** le dépôt.
2. Créer une **branche dédiée** (`git checkout -b ma-fonctionnalite`).
3. Commiter vos changements (`git commit -m "Ajout de X"`).
4. Pousser sur votre fork (`git push origin ma-fonctionnalite`).
5. Ouvrir une **Pull Request** vers la branche `Development`.

> 💡 **Bon à savoir** :
> - Respectez les [conventions de commit](https://www.conventionalcommits.org/).
> - Ajoutez des tests pour les nouvelles fonctionnalités.

---

## **📄 Documentation**
- **[Guide de déploiement](docs/deployment.md)** : Déployer NeoSaaS sur un serveur.
- **[API Reference](docs/api.md)** : Détails des endpoints disponibles.
- **[Architecture](docs/architecture.md)** : Schéma technique du projet.

---
## **🔗 Liens utiles**
- **Site officiel** : [https://neosaas.com](https://neosaas.com)
- **Support** : [Ouvrir un ticket](https://github.com/neosaastech/neosaas-website/issues)
- **Communauté** : [Rejoindre Discord](https://discord.gg/neosaas)

---
## **📜 Licence**
Ce projet est sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

---
*✨ Développé avec amour par [Neomnia](https://neomnia.com) et la communauté open-source.*
