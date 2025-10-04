# **NeoSaaS** 🚀
*Un template open-source prêt à l'emploi pour développer votre SaaS.*

**Version :** `0.9.1 (Bêta)`
**Statut :** En développement actif
**Licence :** [MIT](LICENSE)
**Documentation :** [Lire la documentation](https://docs.neosaas.com)
**Téléchargement :** [Lien vers l'application](https://neosaas.com/download)

---

## **📌 Description**
NeoSaaS est un **template open-source** conçu pour accélérer le développement de votre application SaaS. Il intègre une architecture modulaire basée sur **Docker** et **Docker Compose**, permettant un déploiement simple et une scalabilité immédiate.

Le projet est organisé pour séparer les fonctionnalités clés (vente, contenu, blog, etc.) et faciliter les contributions communautaires.

---

## **⚙️ Prérequis**
- **Docker** (version 20.10 ou supérieure)
- **Docker Compose** (version 1.29 ou supérieure)
- **Git** (pour cloner le dépôt)
- Un terminal (Linux/MacOS/Windows avec WSL)

---

## **🛠 Installation**

### **1. Cloner le dépôt**
```bash
git clone https://github.com/neomnia/neosaas.git
cd neosaas
```

### **2. Configurer les branches**
Le dépôt est organisé avec deux branches principales :
- **`prod`** : Version stable (déploiement en production).
- **`dev`** : Version en développement (fonctionnalités en cours).

Les autres branches correspondent aux **modules** du projet :
- `vente` (à venir)
- `contenu` (inclut le blog)

Pour basculer vers une branche spécifique :
```bash
git checkout <nom-de-la-branche>
```

### **3. Lancer l'application avec Docker**
```bash
# Construire les conteneurs
docker-compose build

# Démarrer les services
docker-compose up -d

# Accéder à l'application
open http://localhost:3000
```

> ⚠️ **Note** : La première exécution peut prendre quelques minutes (téléchargement des images Docker).

---

## **📂 Structure du projet**
```
neosaas/
├── docker/                  # Fichiers de configuration Docker
│   ├── Dockerfile           # Configuration principale
│   └── docker-compose.yml   # Orchestration des services
├── src/
│   ├── vente/               # Module "Vente" (à venir)
│   ├── contenu/             # Module "Contenu" (blog, pages statiques)
│   └── core/                # Cœur de l'application (API, auth, etc.)
├── docs/                    # Documentation technique
├── .gitignore
├── LICENSE
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
5. Ouvrir une **Pull Request** vers la branche `dev`.

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
- **Support** : [Ouvrir un ticket](https://github.com/neomnia/neosaas/issues)
- **Communauté** : [Rejoindre Discord](https://discord.gg/neosaas)

---
## **📜 Licence**
Ce projet est sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

---
*✨ Développé avec amour par [Neomnia](https://neomnia.com) et la communauté open-source.*
