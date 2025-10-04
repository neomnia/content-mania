# **NeoSaaS** 🚀
*Un template open-source prêt à l'emploi pour développer votre SaaS.*

![Release (latest incl. pre)](https://img.shields.io/github/v/release/neosaastech/neosaas-website?include_prereleases)
![Build (Development)](https://img.shields.io/github/actions/workflow/status/neosaastech/neosaas-website/docker-image.yml?branch=Development&label=build%20(Development))
![Last commit (Development)](https://img.shields.io/github/last-commit/neosaastech/neosaas-website/Development)
[![GHCR package](https://img.shields.io/badge/GHCR-neosaas--website%2Fweb-000?logo=docker)](https://github.com/neosaastech/neosaas-website/pkgs/container/neosaas-website%2Fweb)

**Version :** `0.9.1 (Bêta)`  
**Statut :** En développement actif  
**Licence :** [MIT](LICENSE)  
**Documentation :** [Lire la documentation](https://docs.neosaas.com)  
**Téléchargement (dernière release) :** [Releases · latest](https://github.com/neosaastech/neosaas-website/releases/latest)

---

## **📌 Description**
NeoSaaS est un **template open-source** conçu pour accélérer le développement de ton application SaaS. Il intègre une architecture modulaire basée sur **Docker** et **GitHub Actions** pour un déploiement automatisé et une scalabilité immédiate.

---

## **🔗 Système de liens qui suit les mises à jour**
Ces liens/badges pointent **toujours** vers les dernières versions/builds :

- **Dernière release (auto)** :  
  👉 https://github.com/neosaastech/neosaas-website/releases/latest

- **Statut build branche `Development` (auto)** :  
  👉 https://github.com/neosaastech/neosaas-website/actions?query=branch%3ADevelopment

- **Image Docker “toujours à jour” pour `Development`** :  
  `ghcr.io/neosaastech/neosaas-website/web:development`

- **Images (toutes tags & digests)** :  
  👉 https://github.com/neosaastech/neosaas-website/pkgs/container/neosaas-website%2Fweb

> ℹ️ Les workflows taguent automatiquement les images en :
> - `development` (toujours la dernière build de la branche `Development`)
> - `sha-<shortsha>` (ex. `sha-abcdef1`) pour figer une version exacte

---

## **⚙️ Prérequis**
- **Docker** (version 20.10 ou supérieure)
- **GitHub CLI** (`gh`) pour interagir avec GitHub Container Registry (GHCR)
- Un **compte GitHub** avec accès au dépôt [neosaastech/neosaas-website](https://github.com/neosaastech/neosaas-website)

---

## **🛠 Installation et lancement avec Docker**

### **1. Récupérer l'image Docker depuis GitHub**
Les images Docker sont automatiquement construites et poussées vers **GitHub Container Registry (GHCR)** via GitHub Actions.

#### **Nom de l'image**
- **Nom complet** : `ghcr.io/neosaastech/neosaas-website/web`
- **Tags disponibles** :
  - `development` (pour la branche `Development`) — *toujours à jour*
  - `sha-<shortsha>` (ex: `sha-abcdef1`) — *pointeur immuable*

#### **Authentification avec GHCR**
```bash
echo "<TON_TOKEN_GITHUB>" | docker login ghcr.io -u <TON_USERNAME> --password-stdin
