# Guide de configuration HTTPS avec Let's Encrypt

**Date:** 2026-01-13
**Objectif:** Configurer HTTPS pour sécuriser les communications (protection contre man-in-the-middle)

---

## Prérequis

- Nom de domaine configuré (ex: inventaire.example.com)
- Serveur avec accès root/sudo
- Docker et Docker Compose installés
- Ports 80 et 443 ouverts dans le firewall

---

## Étape 1: Configurer DNS

Pointez votre domaine vers l'IP de votre serveur:

```
Type A    inventaire.example.com     →  votre-ip-serveur
Type A    www.inventaire.example.com →  votre-ip-serveur
```

Vérification:
```bash
nslookup inventaire.example.com
```

---

## Étape 2: Modifier nginx.conf

Remplacez `your-domain.com` par votre domaine réel dans `nginx.conf`:

```bash
# Remplacer:
server_name your-domain.com www.your-domain.com;

# Par:
server_name inventaire.example.com www.inventaire.example.com;
```

Également dans les chemins SSL:
```bash
ssl_certificate /etc/letsencrypt/live/inventaire.example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/inventaire.example.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/inventaire.example.com/chain.pem;
```

---

## Étape 3: Ajouter service Nginx + Certbot au docker-compose.yml

Ajoutez ces services dans `docker-compose.yml`:

```yaml
services:
  # ... services existants (postgres, redis, api, web)

  nginx:
    image: nginx:1.25-alpine
    container_name: inventaire_nginx
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
    restart: unless-stopped
    networks:
      - inventaire-network

  certbot:
    image: certbot/certbot:latest
    container_name: inventaire_certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - inventaire-network
```

---

## Étape 4: Obtenir le certificat SSL initial

**AVANT** de démarrer nginx avec HTTPS, obtenez d'abord le certificat:

```bash
# Créer les répertoires
mkdir -p certbot/conf certbot/www

# Obtenir le certificat (mode standalone, avant nginx)
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email \
  -d inventaire.example.com \
  -d www.inventaire.example.com
```

**Résultat attendu:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/inventaire.example.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/inventaire.example.com/privkey.pem
```

---

## Étape 5: Démarrer les services

```bash
# Démarrer tous les services (incluant nginx avec HTTPS)
docker-compose up -d

# Vérifier les logs
docker-compose logs -f nginx
```

---

## Étape 6: Tester HTTPS

1. **Accéder au site:**
   - http://inventaire.example.com → redirige vers https://
   - https://inventaire.example.com → ✅ Sécurisé

2. **Vérifier le certificat:**
   ```bash
   openssl s_client -connect inventaire.example.com:443 -servername inventaire.example.com
   ```

3. **Test SSL Labs:**
   https://www.ssllabs.com/ssltest/analyze.html?d=inventaire.example.com

   **Objectif:** Note A ou A+

---

## Renouvellement automatique

Le container `certbot` renouvelle automatiquement les certificats tous les 12h.

**Vérification manuelle:**
```bash
docker exec inventaire_certbot certbot renew --dry-run
```

**Forcer le renouvellement:**
```bash
docker exec inventaire_certbot certbot renew --force-renewal
docker-compose restart nginx
```

---

## Troubleshooting

### Problème: "Certificate not found"

```bash
# Vérifier que le certificat existe
ls -la certbot/conf/live/inventaire.example.com/

# Si absent, relancer l'étape 4
```

### Problème: "Connection refused on port 443"

```bash
# Vérifier que nginx écoute sur 443
docker exec inventaire_nginx netstat -tuln | grep 443

# Vérifier firewall
sudo ufw status
sudo ufw allow 443/tcp
```

### Problème: "Too many requests" (Rate limit Let's Encrypt)

Let's Encrypt limite à 5 certificats par domaine par semaine.

**Solution:**
- Utiliser le staging server pour tests:
  ```bash
  --test-cert
  ```
- Attendre 7 jours pour reset du rate limit
- Utiliser un sous-domaine différent

---

## Configuration CORS après HTTPS

Une fois HTTPS activé, mettez à jour `apps/api/.env`:

```env
# Remplacer:
CORS_ORIGIN=http://localhost:5175,http://localhost:8080

# Par (en production):
CORS_ORIGIN=https://inventaire.example.com
```

---

## Checklist sécurité finale

- [ ] Certificat SSL valide et installé
- [ ] Redirection HTTP → HTTPS fonctionnelle
- [ ] HSTS header activé (max-age=31536000)
- [ ] Note SSL Labs: A ou A+
- [ ] CORS configuré avec origine HTTPS uniquement
- [ ] Renouvellement automatique testé
- [ ] Backup du dossier `certbot/conf`

---

## Commandes utiles

```bash
# Voir les certificats
docker exec inventaire_certbot certbot certificates

# Logs certbot
docker logs inventaire_certbot

# Logs nginx
docker logs inventaire_nginx

# Recharger config nginx (sans downtime)
docker exec inventaire_nginx nginx -s reload

# Tester config nginx
docker exec inventaire_nginx nginx -t
```

---

**Documentation officielle:**
- Let's Encrypt: https://letsencrypt.org/docs/
- Certbot: https://certbot.eff.org/docs/
- Nginx SSL: https://nginx.org/en/docs/http/configuring_https_servers.html
