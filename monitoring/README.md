# Monitoring Stack - Inventaire SI

Ce dossier contient la configuration du stack de monitoring pour l'application Inventaire SI.

## Stack Technologique

- **Prometheus** : Collecte et stockage des métriques
- **Loki** : Agrégation et interrogation des logs
- **Promtail** : Agent de collecte des logs
- **Grafana** : Visualisation et dashboards

## Services

### Prometheus (Port 9090)
- URL: http://localhost:9090
- Collecte les métriques de l'API toutes les 10 secondes
- Endpoint métriques API: http://localhost:3001/api/metrics

### Loki (Port 3100)
- URL: http://localhost:3100
- Agrège les logs depuis Promtail
- Stocke les logs de l'application

### Grafana (Port 3000)
- URL: http://localhost:3000
- Login par défaut: `admin` / `admin` (à changer au premier démarrage)
- Dashboards pré-configurés :
  - **API Dashboard** : Métriques HTTP (latence, taux de requêtes, erreurs)
  - **Business Dashboard** : Métriques métier (prêts, employés, équipements)

## Démarrage

```bash
# Démarrer tout le stack (incluant monitoring)
docker-compose up -d

# Vérifier que tous les services sont démarrés
docker-compose ps
```

## Métriques Disponibles

### Métriques HTTP
- `http_requests_total` : Nombre total de requêtes HTTP
- `http_request_duration_seconds` : Durée des requêtes HTTP (histogram)
- `http_response_size_bytes` : Taille des réponses HTTP
- `http_requests_in_progress` : Requêtes en cours de traitement

### Métriques Business
- `loans_total{status="OPEN|CLOSED"}` : Nombre de prêts par statut
- `loans_created_total` : Nombre total de prêts créés
- `loans_closed_total` : Nombre total de prêts fermés
- `employees_total` : Nombre total d'employés
- `assets_total{status="EN_STOCK|PRETE|HS|REPARATION"}` : Nombre d'équipements par statut

### Métriques Base de Données
- `db_query_duration_seconds` : Durée des requêtes DB
- `db_errors_total` : Nombre d'erreurs DB

### Métriques Node.js (par défaut)
- `process_cpu_user_seconds_total` : Utilisation CPU
- `process_resident_memory_bytes` : Mémoire utilisée
- `nodejs_eventloop_lag_seconds` : Latence event loop
- `nodejs_heap_size_used_bytes` : Taille heap utilisée

## Queries Prometheus Utiles

```promql
# Taux de requêtes par seconde
rate(http_requests_total[5m])

# Latence p95 (95e percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Taux d'erreurs 5xx
sum(rate(http_requests_total{status_code=~"5.."}[5m]))

# Prêts actifs
loans_total{status="OPEN"}

# Activité prêts (créations par heure)
rate(loans_created_total[1h]) * 3600
```

## Logs

Les logs sont collectés depuis :
- `/var/log/api/*.log` : Logs de l'API (Winston JSON)

Format des logs JSON :
```json
{
  "timestamp": "2025-12-30T12:34:56.789Z",
  "level": "info",
  "message": "Message du log",
  "context": "ServiceName",
  "...": "métadonnées supplémentaires"
}
```

## Health Checks

L'API expose plusieurs endpoints de health check :

- `GET /api/health` : Health check simple
- `GET /api/health/liveness` : Liveness probe (serveur vivant)
- `GET /api/health/readiness` : Readiness probe (prêt à recevoir trafic)
- `GET /api/health/startup` : Startup probe (initialisation complète)

Docker utilise automatiquement `/api/health/readiness` pour vérifier la santé du container.

## Dashboards Grafana

### API Dashboard
- Taux de requêtes par seconde
- Latence p95
- Taux d'erreurs 5xx
- Requêtes en cours

### Business Dashboard
- Total employés
- Prêts actifs
- Total équipements
- Activité prêts (créations/fermetures)
- Répartition équipements par statut

## Configuration

### Modifier les intervals de collecte

**Prometheus** (`monitoring/prometheus.yml`) :
```yaml
global:
  scrape_interval: 15s # Modifier ici
```

**Promtail** : Les logs sont envoyés en temps réel

### Ajouter de nouvelles métriques

1. Définir la métrique dans `apps/api/src/config/metrics.js`
2. Instrumenter le code pour enregistrer les valeurs
3. Redémarrer l'API
4. Créer un panel dans Grafana

Exemple :
```javascript
// Dans config/metrics.js
export const myMetric = new promClient.Counter({
  name: 'my_metric_total',
  help: 'Description de ma métrique',
  registers: [register],
});

// Dans votre code
import { myMetric } from '../config/metrics.js';
myMetric.inc(); // Incrémenter
```

## Troubleshooting

### Prometheus ne collecte pas les métriques
1. Vérifier que l'API est accessible : `curl http://localhost:3001/api/metrics`
2. Vérifier la config Prometheus : `docker-compose logs prometheus`
3. Vérifier les targets dans Prometheus UI : http://localhost:9090/targets

### Grafana ne montre pas de données
1. Vérifier que les datasources sont configurées (Status > Data Sources)
2. Vérifier qu'il y a des données dans Prometheus : http://localhost:9090/graph
3. Ajuster la plage de temps dans Grafana (dernières 15 minutes minimum)

### Logs ne s'affichent pas dans Grafana
1. Vérifier que Promtail envoie des logs : `docker-compose logs promtail`
2. Vérifier que les fichiers de log existent : `ls -la apps/api/logs/`
3. Vérifier la connexion Loki → Promtail : `curl http://localhost:3100/ready`

## Maintenance

### Rotation des logs
Les logs Winston sont automatiquement limités à :
- Fichier max : 5MB
- Nombre de fichiers : 5
- Total max par type : 25MB

### Nettoyage des données
```bash
# Supprimer les données de monitoring (ne supprime pas la config)
docker-compose down
docker volume rm inventaire_si_prometheus-data inventaire_si_loki-data inventaire_si_grafana-data
docker-compose up -d
```

## Production

Pour la production, pensez à :
1. Changer le mot de passe Grafana (variable `GRAFANA_ADMIN_PASSWORD`)
2. Configurer la rétention des données Prometheus
3. Mettre en place des alertes dans Grafana
4. Sauvegarder les dashboards Grafana personnalisés
5. Utiliser des secrets pour les mots de passe

