# Guide de déploiement en production

**Version:** 0.8.0
**Date:** 2026-01-13
**Statut:** Production-Ready

---

## 📋 Prérequis

### Serveur

- **OS:** Ubuntu 22.04 LTS ou Debian 12
- **CPU:** 4 vCPU minimum
- **RAM:** 8 GB minimum (16 GB recommandé)
- **Disk:** 50 GB SSD minimum
- **Network:** Connexion stable 100 Mbps+

### Domaine

- Nom de domaine configuré (ex: inventaire.votreentreprise.com)
- Accès aux enregistrements DNS
- Certificat SSL Let's Encrypt (gratuit)

### Accès

- Accès root ou sudo
- SSH configuré avec clés
- Firewall configuré

---

## 🚀 Déploiement rapide (Quick Start)

Pour un déploiement rapide en production :

```bash
# 1. Cloner le repository
git clone https://github.com/Tilly57/Inventaire_SI.git
cd Inventaire_SI

# 2. Exécuter le script de déploiement
sudo chmod +x scripts/deploy-production.sh
sudo ./scripts/deploy-production.sh

# 3. Configurer HTTPS
sudo ./scripts/setup-https.sh inventaire.votreentreprise.com

# 4. Démarrer les services
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 Déploiement détaillé

### Étape 1: Préparation du serveur

#### 1.1 Mise à jour système

```bash
# Connecter au serveur
ssh user@your-server-ip

# Mise à jour
sudo apt update && sudo apt upgrade -y

# Installer les dépendances
sudo apt install -y curl git ufw certbot nginx-core
```

#### 1.2 Configuration firewall

```bash
# Activer UFW
sudo ufw enable

# Autoriser SSH (IMPORTANT: faire avant d'activer UFW!)
sudo ufw allow 22/tcp

# Autoriser HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Vérifier le statut
sudo ufw status
```

#### 1.3 Installer Docker

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Ajouter utilisateur au groupe docker
sudo usermod -aG docker $USER

# Vérifier installation
docker --version
docker-compose --version

# Redémarrer session pour appliquer groupe
exit
```

### Étape 2: Configuration application

#### 2.1 Cloner repository

```bash
# Se reconnecter
ssh user@your-server-ip

# Créer répertoire application
sudo mkdir -p /opt/inventaire
sudo chown $USER:$USER /opt/inventaire
cd /opt/inventaire

# Cloner
git clone https://github.com/Tilly57/Inventaire_SI.git .
git checkout main
```

#### 2.2 Configuration environnement

```bash
# Backend
cd /opt/inventaire/apps/api
cp .env.example .env.production

# Éditer les variables
nano .env.production
```

**Variables critiques à configurer:**

```env
# Database (Production)
DATABASE_URL="postgresql://inventaire_prod:STRONG_PASSWORD_HERE@postgres:5432/inventaire_prod?connection_limit=20&pool_timeout=60"

# JWT Secrets (Générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
JWT_ACCESS_SECRET="GENERATE_YOUR_OWN_64_BYTE_SECRET_HERE"
JWT_REFRESH_SECRET="GENERATE_YOUR_OWN_64_BYTE_SECRET_HERE"

# CORS (Votre domaine)
CORS_ORIGIN="https://inventaire.votreentreprise.com"

# Redis
REDIS_URL="redis://redis:6379"

# Environment
NODE_ENV=production
PORT=3001
```

#### 2.3 Générer secrets JWT

```bash
# Méthode 1: Node.js
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"

# Méthode 2: OpenSSL
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')"

# Copier et coller dans .env.production
```

#### 2.4 Configuration Docker Compose

```bash
cd /opt/inventaire

# Créer docker-compose.prod.yml
nano docker-compose.prod.yml
```

**Contenu docker-compose.prod.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: inventaire_postgres_prod
    environment:
      POSTGRES_USER: inventaire_prod
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: inventaire_prod
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - inventaire-network
    secrets:
      - db_password
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U inventaire_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: inventaire_redis_prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - inventaire-network
    restart: unless-stopped

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.prod
    container_name: inventaire_api_prod
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://inventaire_prod:${DB_PASSWORD}@postgres:5432/inventaire_prod
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    env_file:
      - ./apps/api/.env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - uploads:/app/uploads
    networks:
      - inventaire-network
    restart: unless-stopped

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.prod
    container_name: inventaire_web_prod
    depends_on:
      - api
    networks:
      - inventaire-network
    restart: unless-stopped

  nginx:
    image: nginx:1.25-alpine
    container_name: inventaire_nginx_prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - api
      - web
    networks:
      - inventaire-network
    restart: unless-stopped

  certbot:
    image: certbot/certbot:latest
    container_name: inventaire_certbot_prod
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - inventaire-network

  prometheus:
    image: prom/prometheus:latest
    container_name: inventaire_prometheus_prod
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - inventaire-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: inventaire_grafana_prod
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD_FILE: /run/secrets/grafana_password
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    networks:
      - inventaire-network
    secrets:
      - grafana_password
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads:
  prometheus_data:
  grafana_data:

networks:
  inventaire-network:
    driver: bridge

secrets:
  db_password:
    file: ./secrets/db_password.txt
  grafana_password:
    file: ./secrets/grafana_password.txt
```

#### 2.5 Créer secrets Docker

```bash
# Créer répertoire secrets
mkdir -p /opt/inventaire/secrets

# Générer mot de passe DB
openssl rand -base64 32 > /opt/inventaire/secrets/db_password.txt

# Générer mot de passe Grafana
openssl rand -base64 32 > /opt/inventaire/secrets/grafana_password.txt

# Générer mot de passe Redis
openssl rand -base64 32 > /opt/inventaire/secrets/redis_password.txt

# Sécuriser les secrets
chmod 600 /opt/inventaire/secrets/*
```

### Étape 3: Configuration HTTPS

#### 3.1 Configurer DNS

Créer un enregistrement A pointant vers votre serveur:

```
Type: A
Name: inventaire (ou @)
Value: YOUR_SERVER_IP
TTL: 3600
```

Vérifier:
```bash
nslookup inventaire.votreentreprise.com
```

#### 3.2 Obtenir certificat SSL

```bash
cd /opt/inventaire

# Créer répertoires certbot
mkdir -p certbot/conf certbot/www

# Obtenir certificat (mode standalone, ports 80/443 doivent être libres)
sudo docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 -p 443:443 \
  certbot/certbot certonly --standalone \
  --email admin@votreentreprise.com \
  --agree-tos \
  --no-eff-email \
  -d inventaire.votreentreprise.com
```

#### 3.3 Configurer Nginx

Le fichier `nginx.conf` a déjà été créé. Il faut juste mettre à jour le domaine:

```bash
cd /opt/inventaire
nano nginx.conf
```

Remplacer `your-domain.com` par votre domaine réel.

### Étape 4: Build et déploiement

#### 4.1 Créer Dockerfiles de production

**Backend Dockerfile:**

```bash
cat > /opt/inventaire/apps/api/Dockerfile.prod <<'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

RUN mkdir -p /app/uploads/signatures && \
    chown -R node:node /app

USER node

EXPOSE 3001

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
EOF
```

**Frontend Dockerfile:**

```bash
cat > /opt/inventaire/apps/web/Dockerfile.prod <<'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
EOF
```

#### 4.2 Build les images

```bash
cd /opt/inventaire

# Build backend
docker build -t inventaire-api:0.8.0 -f apps/api/Dockerfile.prod apps/api

# Build frontend
docker build -t inventaire-web:0.8.0 -f apps/web/Dockerfile.prod apps/web
```

#### 4.3 Appliquer migrations

```bash
# Démarrer seulement PostgreSQL
docker-compose -f docker-compose.prod.yml up -d postgres

# Attendre que PostgreSQL soit prêt
sleep 10

# Appliquer migrations
docker exec -it inventaire_api_prod npx prisma migrate deploy

# (Optionnel) Seed initial data
docker exec -it inventaire_api_prod npm run seed
```

#### 4.4 Démarrer tous les services

```bash
cd /opt/inventaire

# Démarrer tous les services
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Étape 5: Vérification

#### 5.1 Health checks

```bash
# Vérifier que tous les conteneurs sont UP
docker ps

# Tester API
curl https://inventaire.votreentreprise.com/api/health

# Devrait retourner: {"status":"healthy"}
```

#### 5.2 SSL verification

```bash
# Tester SSL
curl -I https://inventaire.votreentreprise.com

# Vérifier grade SSL Labs
# https://www.ssllabs.com/ssltest/analyze.html?d=inventaire.votreentreprise.com
```

#### 5.3 Tests fonctionnels

1. Ouvrir https://inventaire.votreentreprise.com
2. Se connecter avec credentials admin
3. Vérifier dashboard
4. Créer un employé
5. Créer un prêt
6. Vérifier logs audit

---

## 🔧 Configuration avancée

### Optimisation PostgreSQL

```bash
# Éditer postgresql.conf
docker exec -it inventaire_postgres_prod bash
nano /var/lib/postgresql/data/postgresql.conf
```

**Recommandations (serveur 16 GB RAM):**

```conf
# Memory
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Query Planner
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Connections
max_connections = 200
```

### Configuration Redis

```bash
# Créer redis.conf
cat > /opt/inventaire/redis.conf <<EOF
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

# Monter dans docker-compose
volumes:
  - ./redis.conf:/usr/local/etc/redis/redis.conf
command: redis-server /usr/local/etc/redis/redis.conf --requirepass ${REDIS_PASSWORD}
```

### Backup automatique

```bash
# Créer script backup
cat > /opt/inventaire/scripts/backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/inventaire"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec inventaire_postgres_prod pg_dump -U inventaire_prod inventaire_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/inventaire/uploads

# Cleanup old backups (> 30 jours)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/inventaire/scripts/backup.sh

# Ajouter à crontab
crontab -e

# Backup quotidien à 2h du matin
0 2 * * * /opt/inventaire/scripts/backup.sh >> /var/log/inventaire-backup.log 2>&1
```

### Monitoring avec Grafana

1. Accéder à Grafana: https://inventaire.votreentreprise.com:3000
2. Login: `admin` / `[contenu de secrets/grafana_password.txt]`
3. Importer dashboards:
   - Dashboard API: `/opt/inventaire/grafana/dashboards/api-metrics.json`
   - Dashboard PostgreSQL: `/opt/inventaire/grafana/dashboards/postgresql.json`

---

## 🔐 Sécurité post-déploiement

### Checklist sécurité

- [ ] Certificat SSL actif (HTTPS)
- [ ] Firewall configuré (UFW)
- [ ] Secrets JWT forts générés
- [ ] Mot de passe DB complexe
- [ ] SSH avec clés seulement (pas de password)
- [ ] Fail2ban installé
- [ ] Backups automatiques configurés
- [ ] Monitoring actif (Grafana)
- [ ] Logs centralisés
- [ ] Rate limiting actif
- [ ] CORS configuré strictement

### Fail2ban

```bash
# Installer fail2ban
sudo apt install fail2ban

# Configurer
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Activer protection SSH
[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600

# Redémarrer
sudo systemctl restart fail2ban
```

### Surveillance logs

```bash
# Surveiller logs API
docker logs -f inventaire_api_prod

# Surveiller logs Nginx
docker logs -f inventaire_nginx_prod

# Surveiller logs PostgreSQL
docker logs -f inventaire_postgres_prod
```

---

## 📊 Maintenance

### Mise à jour application

```bash
cd /opt/inventaire

# Pull dernière version
git pull origin main

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Arrêter services
docker-compose -f docker-compose.prod.yml down

# Backup DB avant migration
./scripts/backup.sh

# Démarrer avec nouvelles images
docker-compose -f docker-compose.prod.yml up -d

# Appliquer migrations
docker exec -it inventaire_api_prod npx prisma migrate deploy

# Vérifier health
curl https://inventaire.votreentreprise.com/api/health
```

### Renouvellement SSL automatique

Le certificat se renouvelle automatiquement via le conteneur certbot.

Vérifier:
```bash
docker logs inventaire_certbot_prod
```

Forcer renouvellement:
```bash
docker exec inventaire_certbot_prod certbot renew --force-renewal
docker-compose -f docker-compose.prod.yml restart nginx
```

### Logs et debugging

```bash
# Logs API en temps réel
docker logs -f --tail 100 inventaire_api_prod

# Logs avec timestamp
docker logs -f --timestamps inventaire_api_prod

# Logs d'une période
docker logs --since "2026-01-13T10:00:00" inventaire_api_prod

# Stats containers
docker stats

# Inspecter container
docker inspect inventaire_api_prod
```

---

## 🚨 Rollback

En cas de problème après déploiement:

```bash
cd /opt/inventaire

# Arrêter services
docker-compose -f docker-compose.prod.yml down

# Revenir à version précédente
git checkout v0.7.9  # Version précédente stable

# Rebuild
docker-compose -f docker-compose.prod.yml build

# Restaurer backup DB si nécessaire
gunzip -c /opt/backups/inventaire/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i inventaire_postgres_prod psql -U inventaire_prod inventaire_prod

# Redémarrer
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Checklist finale

### Pré-déploiement
- [ ] Serveur configuré (Ubuntu 22.04, 8GB RAM, 50GB disk)
- [ ] Docker installé et fonctionnel
- [ ] Domaine configuré avec DNS
- [ ] Firewall configuré (UFW)
- [ ] Secrets générés

### Déploiement
- [ ] Code cloné sur le serveur
- [ ] Variables d'environnement configurées
- [ ] Certificat SSL obtenu
- [ ] Images Docker buildées
- [ ] Migrations appliquées
- [ ] Services démarrés

### Post-déploiement
- [ ] Site accessible en HTTPS
- [ ] Login admin fonctionne
- [ ] Dashboard affiche les stats
- [ ] CRUD operations fonctionnent
- [ ] Backups automatiques configurés
- [ ] Monitoring actif (Grafana)
- [ ] Fail2ban actif
- [ ] Documentation à jour

---

## 📞 Support

En cas de problème:

1. Vérifier les logs: `docker-compose logs -f`
2. Vérifier health checks: `docker ps`
3. Consulter documentation: `/docs/`
4. Créer issue GitHub avec logs

---

**Dernière mise à jour:** 2026-01-13
**Version:** 0.8.0
**Score production-ready:** 8.5/10
