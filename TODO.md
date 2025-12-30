# TODO - Inventaire SI

Analyse initiale: **2025-12-29** - Version **v0.4.1**
**Dernière mise à jour:** **2025-12-30** - Version actuelle: **v0.6.7**

---

## ✅ COMPLÉTÉ (v0.6.5 - v0.6.7)

### Design & UX
- ✅ **v0.6.7:** Design responsive complet (mobile/tablette/desktop)
- ✅ **v0.6.7:** Interface moderne et attractive avec animations
- ✅ **v0.6.7:** 8 tableaux optimisés pour mobile (vue cards)
- ✅ **v0.6.7:** 9 pages avec layouts adaptatifs
- ✅ **v0.6.7:** Composants UI améliorés (Cards, Buttons, StatsCard)
- ✅ **v0.6.7:** Hook useMediaQuery pour détection breakpoints
- ✅ **v0.6.7:** Composant ResponsiveTable générique
- ✅ **v0.6.7:** Scrollbars personnalisées et smooth scroll
- ✅ **v0.6.6:** Gestion signatures ADMIN (modification/suppression)
- ✅ **v0.6.5:** Signatures tactiles pour prêts

### DevOps
- ✅ **v0.6.7:** Script deploy-production.sh avec nettoyage branches release

---

## 🔴 CRITIQUE - À faire immédiatement

### 1. Tests (Effort: 40h) ⚠️ PRIORITÉ #1

**Problème:** Absence totale de tests (0% coverage)

**Backend:**
```bash
# Installer Jest + Supertest
npm install --save-dev jest @types/jest supertest
```

**Tests prioritaires:**
- [ ] Services (business logic) - 7 services
  - [ ] `loans.service.js` - Workflows prêts
  - [ ] `auth.service.js` - Authentification
  - [ ] `employees.service.js` - CRUD employés
  - [ ] `assetModels.service.js` - Cascade delete
  - [ ] `assetItems.service.js` - Gestion équipements
- [ ] Middleware (auth, RBAC, errorHandler)
- [ ] Controllers (HTTP handlers)
- [ ] Tests d'intégration (routes complètes)
- [ ] E2E workflows critiques (création prêt → signature → fermeture)

**Frontend:**
```bash
# Installer Vitest + Testing Library
npm install --save-dev vitest @testing-library/react @testing-library/user-event
```

**Tests prioritaires:**
- [ ] Composants critiques (Login, LoanFormDialog)
- [ ] Hooks personnalisés (useAuth, useLoans)
- [ ] Forms avec validation
- [ ] Routes protection (ProtectedRoute)
- [ ] E2E user journeys (Cypress/Playwright)

**Objectif:** 80% coverage minimum

---

### 2. Sécurité - Secrets Management (Effort: 4h)

**Problème:** Secrets hardcodés dans docker-compose.yml

**Actions:**
- [ ] Changer tous les secrets par défaut
  ```bash
  # Générer secrets forts
  openssl rand -base64 32 > secrets/jwt_access.txt
  openssl rand -base64 32 > secrets/jwt_refresh.txt
  ```

- [ ] Utiliser Docker secrets
  ```yaml
  # docker-compose.yml
  services:
    api:
      env_file: .env.production
      secrets:
        - jwt_access_secret
        - jwt_refresh_secret

  secrets:
    jwt_access_secret:
      file: ./secrets/jwt_access.txt
    jwt_refresh_secret:
      file: ./secrets/jwt_refresh.txt
  ```

- [ ] Ajouter validation au démarrage
  ```javascript
  // apps/api/src/index.js
  if (process.env.JWT_ACCESS_SECRET === 'change_me_access') {
    throw new Error('SECURITY: Change default JWT secrets!');
  }
  ```

- [ ] Mettre à jour .gitignore
  ```
  .env.production
  secrets/
  ```

---

### 3. Rate Limiting (Effort: 2h)

**Problème:** Vulnérabilité brute-force et DDoS

**Actions:**
- [ ] Installer express-rate-limit
  ```bash
  npm install express-rate-limit
  ```

- [ ] Implémenter rate limiting global
  ```javascript
  // apps/api/src/middleware/rateLimiter.js
  import rateLimit from 'express-rate-limit';

  export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Trop de requêtes, réessayez plus tard'
  });

  export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 tentatives
    skipSuccessfulRequests: true
  });
  ```

- [ ] Appliquer aux routes
  ```javascript
  app.use('/api/', generalLimiter);
  app.use('/api/auth/login', loginLimiter);
  ```

---

## 🟠 IMPORTANT - Court terme (1-2 semaines)

### 4. Monitoring et Logs (Effort: 20h)

**Problème:** Impossible de diagnostiquer problèmes en production

#### 4.1 Logging Structuré (Effort: 4h)

**Problème actuel:** 52+ console.log/warn/error non structurés

**Actions:**
- [ ] Installer Winston
  ```bash
  npm install winston
  ```

- [ ] Créer logger centralisé
  ```javascript
  // apps/api/src/config/logger.js
  import winston from 'winston';

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });

  if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }

  export default logger;
  ```

- [ ] Remplacer tous les console.log/warn/error par logger

#### 4.2 Monitoring Stack (Effort: 16h)

**Stack recommandée:** Loki + Prometheus + Grafana

**Actions:**
- [ ] Ajouter Loki (logs)
  ```yaml
  # docker-compose.yml
  services:
    loki:
      image: grafana/loki:2.9.0
      ports:
        - "3100:3100"

    promtail:
      image: grafana/promtail:2.9.0
      volumes:
        - /var/log:/var/log
        - ./promtail-config.yml:/etc/promtail/config.yml
  ```

- [ ] Ajouter Prometheus (métriques)
  ```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ```

- [ ] Ajouter métriques dans API
  ```javascript
  import promClient from 'prom-client';

  const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.send(await promClient.register.metrics());
  });
  ```

- [ ] Ajouter Grafana (dashboards)
  ```yaml
  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3000:3000"
  ```

- [ ] Créer dashboards
  - [ ] Dashboard API (latence, erreurs, throughput)
  - [ ] Dashboard base de données (queries, connections)
  - [ ] Dashboard business (prêts créés, employés actifs)

#### 4.3 Health Checks Robustes (Effort: 2h)

**Actions:**
- [ ] Améliorer endpoint health
  ```javascript
  // apps/api/src/routes/health.routes.js

  // Liveness - Serveur vivant
  router.get('/health/liveness', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Readiness - Prêt à recevoir du trafic
  router.get('/health/readiness', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready', db: 'connected' });
    } catch (err) {
      res.status(503).json({ status: 'not ready', db: 'disconnected' });
    }
  });

  // Startup - Initialisation complète
  router.get('/health/startup', async (req, res) => {
    // Vérifier migrations, seed, etc.
    res.json({ status: 'started' });
  });
  ```

- [ ] Configurer Docker healthcheck
  ```yaml
  # docker-compose.yml
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health/readiness"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
  ```

---

### 5. CI/CD Pipeline (Effort: 8h)

**Problème:** Déploiements manuels, pas de validation automatique

**Actions:**
- [ ] Créer workflow GitHub Actions
  ```yaml
  # .github/workflows/ci.yml
  name: CI/CD Pipeline

  on:
    push:
      branches: [main, staging]
    pull_request:
      branches: [main, staging]

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: '20'

        - name: Install dependencies
          run: |
            cd apps/api && npm ci
            cd ../web && npm ci

        - name: Lint
          run: |
            cd apps/api && npm run lint
            cd ../web && npm run lint

        - name: Test
          run: |
            cd apps/api && npm test -- --coverage
            cd ../web && npm test -- --coverage

        - name: Build
          run: |
            cd apps/api && npm run build
            cd ../web && npm run build

    deploy:
      needs: test
      if: github.ref == 'refs/heads/main'
      runs-on: ubuntu-latest
      steps:
        - name: Deploy to production
          run: |
            ssh user@server 'cd /app && git pull && docker-compose up -d --build'
  ```

- [ ] Configurer secrets GitHub
  - [ ] SSH_PRIVATE_KEY
  - [ ] SERVER_HOST
  - [ ] DATABASE_URL
  - [ ] JWT secrets

- [ ] Ajouter badges README.md
  ```markdown
  ![CI](https://github.com/Tilly57/Inventaire_SI/workflows/CI/badge.svg)
  ![Coverage](https://img.shields.io/codecov/c/github/Tilly57/Inventaire_SI)
  ```

---

### 6. Backups Automatiques (Effort: 4h)

**Problème:** Pas de backup, risque de perte de données

**Actions:**
- [ ] Créer script backup
  ```bash
  #!/bin/bash
  # scripts/backup-db.sh

  BACKUP_DIR="/backups"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="$BACKUP_DIR/inventaire_$TIMESTAMP.sql"

  # Backup
  docker exec inventaire_si-db-1 pg_dump -U inventaire inventaire > "$BACKUP_FILE"

  # Compression
  gzip "$BACKUP_FILE"

  # Upload S3 (optionnel)
  # aws s3 cp "$BACKUP_FILE.gz" s3://inventaire-backups/

  # Cleanup (> 30 jours)
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

  echo "Backup completed: $BACKUP_FILE.gz"
  ```

- [ ] Rendre exécutable
  ```bash
  chmod +x scripts/backup-db.sh
  ```

- [ ] Ajouter cron job
  ```cron
  # Backup quotidien 2h du matin
  0 2 * * * /app/scripts/backup-db.sh >> /var/log/backup.log 2>&1
  ```

- [ ] Tester restore
  ```bash
  # Test de restauration
  gunzip -c backup.sql.gz | docker exec -i inventaire_si-db-1 psql -U inventaire inventaire
  ```

- [ ] Documentation procédure restore
  - [ ] Créer `docs/BACKUP_RESTORE.md`

---

### 7. Validation Environnement (Effort: 2h)

**Problème:** Variables d'environnement non validées

**Actions:**
- [ ] Créer schéma validation Zod
  ```javascript
  // apps/api/src/config/env.js
  import { z } from 'zod';

  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),

    DATABASE_URL: z.string()
      .url()
      .startsWith('postgresql://'),

    JWT_ACCESS_SECRET: z.string()
      .min(32, 'JWT Access Secret must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string()
      .min(32, 'JWT Refresh Secret must be at least 32 characters'),
    JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

    CORS_ORIGIN: z.string().url(),

    SIGNATURES_DIR: z.string().default('/app/uploads/signatures'),

    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  });

  export const env = envSchema.parse(process.env);
  ```

- [ ] Utiliser partout
  ```javascript
  // Au lieu de process.env.PORT
  import { env } from './config/env.js';
  app.listen(env.PORT);
  ```

---

## 🟡 RECOMMANDÉ - Moyen terme (1 mois)

### 8. Optimisations Base de Données (Effort: 8h)

#### 8.1 Indexes (Effort: 2h)

**Actions:**
- [ ] Ajouter indexes Prisma
  ```prisma
  // prisma/schema.prisma

  model Loan {
    // ... champs existants

    @@index([employeeId])
    @@index([status])
    @@index([deletedAt])
    @@index([openedAt])
    @@index([employeeId, status])
  }

  model AssetItem {
    // ... champs existants

    @@index([assetModelId])
    @@index([status])
    @@index([assetModelId, status])
  }

  model Employee {
    @@index([lastName, firstName])
    @@index([email])
  }
  ```

- [ ] Générer migration
  ```bash
  npx prisma migrate dev --name add_indexes
  ```

- [ ] Analyser performance avant/après
  ```sql
  EXPLAIN ANALYZE SELECT * FROM loans WHERE employee_id = 'xxx' AND status = 'OPEN';
  ```

#### 8.2 Connection Pooling (Effort: 1h)

**Actions:**
- [ ] Configurer pool Prisma
  ```prisma
  // prisma/schema.prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")

    // Connection pool
    connectionLimit = 10
    poolTimeout = 30
  }
  ```

#### 8.3 Vues Matérialisées (Effort: 4h)

**Actions:**
- [ ] Créer vue dashboard
  ```sql
  -- migrations/create_dashboard_view.sql
  CREATE MATERIALIZED VIEW dashboard_stats AS
  SELECT
    (SELECT COUNT(*) FROM employees) as total_employees,
    (SELECT COUNT(*) FROM asset_items) as total_assets,
    (SELECT COUNT(*) FROM loans WHERE status = 'OPEN') as active_loans,
    (SELECT COUNT(*) FROM asset_items WHERE status = 'PRETE') as loaned_assets;

  CREATE INDEX ON dashboard_stats (total_employees);
  ```

- [ ] Script refresh
  ```bash
  #!/bin/bash
  # scripts/refresh-dashboard-stats.sh
  docker exec inventaire_si-db-1 psql -U inventaire inventaire -c "REFRESH MATERIALIZED VIEW dashboard_stats;"
  ```

- [ ] Cron refresh (toutes les 5 minutes)
  ```cron
  */5 * * * * /app/scripts/refresh-dashboard-stats.sh
  ```

#### 8.4 Audit Trail (Effort: 4h)

**Actions:**
- [ ] Ajouter modèle AuditLog
  ```prisma
  model AuditLog {
    id        String   @id @default(cuid())
    userId    String
    action    String   // CREATE, UPDATE, DELETE
    tableName String
    recordId  String
    oldValues Json?
    newValues Json?
    createdAt DateTime @default(now())

    user User @relation(fields: [userId], references: [id])

    @@index([tableName, recordId])
    @@index([userId])
    @@index([createdAt])
  }
  ```

- [ ] Implémenter Prisma middleware
  ```javascript
  // apps/api/src/middleware/audit.js
  export function auditMiddleware(prisma) {
    prisma.$use(async (params, next) => {
      const result = await next(params);

      if (['create', 'update', 'delete'].includes(params.action)) {
        await prisma.auditLog.create({
          data: {
            userId: getCurrentUserId(),
            action: params.action.toUpperCase(),
            tableName: params.model,
            recordId: result.id,
            newValues: result
          }
        });
      }

      return result;
    });
  }
  ```

---

### 9. Export de Données (Effort: 8h)

**Problème:** Pas d'export, difficile d'analyser données

**Actions:**
- [ ] Installer ExcelJS
  ```bash
  npm install exceljs
  ```

- [ ] Créer service export
  ```javascript
  // apps/api/src/services/export.service.js
  import { Workbook } from 'exceljs';

  export async function exportEmployees() {
    const employees = await prisma.employee.findMany();

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Employés');

    worksheet.columns = [
      { header: 'Prénom', key: 'firstName', width: 20 },
      { header: 'Nom', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Département', key: 'dept', width: 20 },
    ];

    worksheet.addRows(employees);

    return await workbook.xlsx.writeBuffer();
  }

  export async function exportAssetItems() {
    // Similar logic
  }

  export async function exportLoans(filters = {}) {
    // Similar logic avec filtres
  }
  ```

- [ ] Ajouter routes
  ```javascript
  // apps/api/src/routes/export.routes.js
  router.get('/export/employees', requireAuth, async (req, res) => {
    const buffer = await exportEmployees();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');
    res.send(buffer);
  });
  ```

- [ ] Ajouter boutons export frontend
  ```typescript
  // apps/web/src/pages/EmployeesListPage.tsx
  <Button onClick={() => window.open('/api/export/employees', '_blank')}>
    <Download className="h-4 w-4 mr-2" />
    Exporter Excel
  </Button>
  ```

---

### 10. Notifications (Effort: 16h)

**Problème:** Pas de notifications pour événements importants

#### 10.1 Email Setup (Effort: 8h)

**Actions:**
- [ ] Installer Nodemailer
  ```bash
  npm install nodemailer
  ```

- [ ] Configurer transporter
  ```javascript
  // apps/api/src/config/email.js
  import nodemailer from 'nodemailer';

  export const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  ```

- [ ] Créer templates
  ```javascript
  // apps/api/src/templates/loanCreated.js
  export const loanCreatedTemplate = (loan) => `
    <html>
      <body>
        <h1>Nouveau prêt de matériel</h1>
        <p>Bonjour ${loan.employee.firstName},</p>
        <p>Un prêt a été créé à votre nom.</p>

        <h2>Articles empruntés:</h2>
        <ul>
          ${loan.lines.map(l => `
            <li>${l.assetItem?.assetTag || l.stockItem?.assetModel?.modelName}</li>
          `).join('')}
        </ul>

        <p>Date d'ouverture: ${new Date(loan.openedAt).toLocaleDateString('fr-FR')}</p>
      </body>
    </html>
  `;
  ```

- [ ] Créer service email
  ```javascript
  // apps/api/src/services/email.service.js
  export async function sendLoanCreatedEmail(loan) {
    await transporter.sendMail({
      from: 'inventaire@groupetilly.com',
      to: loan.employee.email,
      subject: 'Nouveau prêt de matériel',
      html: loanCreatedTemplate(loan)
    });
  }

  export async function sendLowStockAlert(item) {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });

    await Promise.all(admins.map(admin =>
      transporter.sendMail({
        from: 'inventaire@groupetilly.com',
        to: admin.email,
        subject: '⚠️ Alerte stock bas',
        html: `Stock bas pour: ${item.brand} ${item.modelName}`
      })
    ));
  }
  ```

- [ ] Intégrer dans workflows
  ```javascript
  // Dans loans.service.js après createLoan
  const loan = await prisma.loan.create({...});
  await sendLoanCreatedEmail(loan); // Envoyer email
  return loan;
  ```

#### 10.2 Queue Jobs (Effort: 8h)

**Actions:**
- [ ] Installer BullMQ + Redis
  ```bash
  npm install bullmq ioredis
  ```

- [ ] Créer queue email
  ```javascript
  // apps/api/src/queues/email.queue.js
  import { Queue, Worker } from 'bullmq';
  import Redis from 'ioredis';

  const connection = new Redis(process.env.REDIS_URL);

  export const emailQueue = new Queue('emails', { connection });

  const worker = new Worker('emails', async (job) => {
    const { type, data } = job.data;

    switch (type) {
      case 'loanCreated':
        await sendLoanCreatedEmail(data);
        break;
      case 'lowStock':
        await sendLowStockAlert(data);
        break;
    }
  }, { connection });
  ```

- [ ] Utiliser queue au lieu d'appel direct
  ```javascript
  // Asynchrone, ne bloque pas la requête
  await emailQueue.add('loanCreated', { type: 'loanCreated', data: loan });
  ```

---

### 11. Recherche Avancée (Effort: 12h)

**Problème:** Recherche limitée, pas de filtres combinés

#### 11.1 Recherche Full-Text PostgreSQL (Effort: 8h)

**Actions:**
- [ ] Ajouter colonnes tsvector
  ```sql
  -- Migration
  ALTER TABLE employees
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('french',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '') || ' ' ||
      coalesce(email, '')
    )
  ) STORED;

  CREATE INDEX employees_search_idx ON employees USING GIN(search_vector);
  ```

- [ ] Créer endpoint recherche
  ```javascript
  // apps/api/src/routes/search.routes.js
  router.get('/search', requireAuth, async (req, res) => {
    const { q } = req.query;

    const [employees, assets] = await Promise.all([
      prisma.$queryRaw`
        SELECT * FROM employees
        WHERE search_vector @@ plainto_tsquery('french', ${q})
        ORDER BY ts_rank(search_vector, plainto_tsquery('french', ${q})) DESC
        LIMIT 10
      `,
      prisma.assetItem.findMany({
        where: {
          OR: [
            { assetTag: { contains: q, mode: 'insensitive' } },
            { serial: { contains: q, mode: 'insensitive' } },
          ]
        },
        take: 10
      })
    ]);

    res.json({ success: true, data: { employees, assets } });
  });
  ```

#### 11.2 Autocomplete (Effort: 4h)

**Actions:**
- [ ] Créer endpoint autocomplete
  ```javascript
  router.get('/autocomplete/employees', requireAuth, async (req, res) => {
    const { q } = req.query;

    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { firstName: { startsWith: q, mode: 'insensitive' } },
          { lastName: { startsWith: q, mode: 'insensitive' } },
        ]
      },
      select: { id: true, firstName: true, lastName: true },
      take: 5
    });

    res.json({ success: true, data: employees });
  });
  ```

- [ ] Créer composant Autocomplete frontend
  ```typescript
  // apps/web/src/components/common/Autocomplete.tsx
  import { useState, useEffect } from 'react';
  import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';

  export function EmployeeAutocomplete({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
      if (query.length < 2) return;

      fetch(`/api/autocomplete/employees?q=${query}`)
        .then(r => r.json())
        .then(data => setResults(data.data));
    }, [query]);

    return (
      <Command>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Rechercher employé..."
        />
        <CommandList>
          {results.map(emp => (
            <CommandItem key={emp.id} onSelect={() => onSelect(emp)}>
              {emp.firstName} {emp.lastName}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    );
  }
  ```

---

### 12. Optimisations Frontend (Effort: 12h)

#### 12.1 Code Splitting (Effort: 4h)

**Actions:**
- [ ] Lazy load routes
  ```typescript
  // apps/web/src/App.tsx
  import { lazy, Suspense } from 'react';

  const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
  const LoansListPage = lazy(() => import('@/pages/LoansListPage'));
  const EmployeesListPage = lazy(() => import('@/pages/EmployeesListPage'));

  function App() {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/loans" element={<LoansListPage />} />
          <Route path="/employees" element={<EmployeesListPage />} />
        </Routes>
      </Suspense>
    );
  }
  ```

- [ ] Bundle analysis
  ```json
  // package.json
  {
    "scripts": {
      "analyze": "vite-bundle-visualizer"
    }
  }
  ```

- [ ] Manual chunks Vite
  ```typescript
  // vite.config.ts
  export default defineConfig({
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'query': ['@tanstack/react-query'],
          }
        }
      }
    }
  });
  ```

#### 12.2 Performance Optimizations (Effort: 4h)

**Actions:**
- [ ] Memoization composants lourds
  ```typescript
  // Avant
  function EmployeeRow({ employee }) {
    return <tr>...</tr>
  }

  // Après
  const EmployeeRow = React.memo(({ employee }) => {
    return <tr>...</tr>
  });
  ```

- [ ] useMemo pour calculs
  ```typescript
  const sortedEmployees = useMemo(() => {
    return employees.sort((a, b) =>
      a.lastName.localeCompare(b.lastName)
    );
  }, [employees]);
  ```

- [ ] useCallback pour callbacks
  ```typescript
  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);
  ```

#### 12.3 Virtual Scrolling (Effort: 4h)

**Actions:**
- [ ] Installer @tanstack/react-virtual
  ```bash
  npm install @tanstack/react-virtual
  ```

- [ ] Implémenter virtual list
  ```typescript
  import { useVirtualizer } from '@tanstack/react-virtual';

  function EmployeesTable({ employees }) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
      count: employees.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 50,
    });

    return (
      <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
        <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <EmployeeRow
              key={virtualRow.index}
              employee={employees[virtualRow.index]}
            />
          ))}
        </div>
      </div>
    );
  }
  ```

---

### 13. Sécurité Headers (Effort: 2h)

**Actions:**
- [ ] Installer Helmet
  ```bash
  npm install helmet
  ```

- [ ] Configurer headers
  ```javascript
  // apps/api/src/index.js
  import helmet from 'helmet';

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true
  }));
  ```

- [ ] CORS production
  ```javascript
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
  ```

---

### 14. SSL/HTTPS (Effort: 4h)

**Actions:**
- [ ] Installer Certbot
  ```bash
  docker-compose exec web apk add certbot certbot-nginx
  ```

- [ ] Obtenir certificat Let's Encrypt
  ```bash
  certbot --nginx -d inventaire.groupetilly.com
  ```

- [ ] Configurer Nginx
  ```nginx
  # apps/web/nginx.conf
  server {
      listen 80;
      server_name inventaire.groupetilly.com;
      return 301 https://$host$request_uri;
  }

  server {
      listen 443 ssl http2;
      server_name inventaire.groupetilly.com;

      ssl_certificate /etc/letsencrypt/live/inventaire.groupetilly.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/inventaire.groupetilly.com/privkey.pem;

      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!aNULL:!MD5;

      location / {
          root /usr/share/nginx/html;
          try_files $uri $uri/ /index.html;
      }

      location /api {
          proxy_pass http://api:3001;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```

- [ ] Auto-renewal cron
  ```cron
  0 0 1 * * certbot renew --quiet
  ```

---

## 💡 SOUHAITÉ - Long terme (3+ mois)

### 15. PWA (Progressive Web App) (Effort: 24h)

**Bénéfices:** Offline mode, installation app-like

**Actions:**
- [ ] Installer vite-plugin-pwa
  ```bash
  npm install -D vite-plugin-pwa
  ```

- [ ] Configurer manifest
  ```typescript
  // vite.config.ts
  import { VitePWA } from 'vite-plugin-pwa';

  export default defineConfig({
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Inventaire SI - Groupe Tilly',
          short_name: 'Inventaire',
          description: 'Gestion inventaire IT',
          theme_color: '#EE2722',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ]
  });
  ```

- [ ] Implémenter Service Worker
- [ ] Offline fallback pages
- [ ] Cache strategies

---

### 16. Elasticsearch (Effort: 32h)

**Bénéfices:** Recherche avancée, facettes, typo tolerance

**Actions:**
- [ ] Setup Elasticsearch
  ```yaml
  # docker-compose.yml
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
  ```

- [ ] Indexer données
- [ ] API recherche avancée
- [ ] Frontend avec facettes

---

### 17. Analytics Dashboard (Effort: 40h)

**Bénéfices:** Insights business, reporting

**Actions:**
- [ ] Créer tables analytics
- [ ] Collecte métriques business
- [ ] Dashboards Grafana
- [ ] Rapports automatiques
- [ ] Export PDF rapports

---

### 18. API Documentation (Effort: 8h)

**Actions:**
- [ ] Installer Swagger/OpenAPI
  ```bash
  npm install swagger-jsdoc swagger-ui-express
  ```

- [ ] Générer documentation
- [ ] Endpoint `/api/docs`
- [ ] Postman collection

---

### 19. Multi-tenant (Effort: 80h)

**Si besoin de gérer plusieurs organisations**

**Actions:**
- [ ] Ajouter modèle Organization
- [ ] Isoler données par tenant
- [ ] Sous-domaines dynamiques
- [ ] Billing/subscriptions

---

### 20. Mobile App (Effort: 120h+)

**React Native ou Flutter**

**Features:**
- [ ] Scanner codes-barres
- [ ] Signature tactile
- [ ] Mode offline
- [ ] Notifications push

---

## 📊 MÉTRIQUES DE SUIVI

### Objectifs Performance

- [ ] **Backend:**
  - [ ] Latence P95 < 200ms
  - [ ] Throughput > 100 req/s
  - [ ] Uptime > 99.9%

- [ ] **Frontend:**
  - [ ] First Contentful Paint < 1.5s
  - [ ] Time to Interactive < 3s
  - [ ] Lighthouse score > 90

- [ ] **Database:**
  - [ ] Query time P95 < 50ms
  - [ ] Connection pool < 80% utilization

### Objectifs Qualité

- [ ] **Tests:**
  - [ ] Backend coverage > 80%
  - [ ] Frontend coverage > 80%
  - [ ] E2E tests critiques paths

- [ ] **Sécurité:**
  - [ ] 0 vulnérabilité CRITIQUE
  - [ ] 0 vulnérabilité HAUTE
  - [ ] Scan automatique hebdomadaire

- [ ] **Documentation:**
  - [ ] 100% endpoints documentés
  - [ ] Guides utilisateur complets
  - [ ] Runbooks opérationnels

---

## 🎯 ROADMAP SUGGÉRÉE

### Sprint 1-2 (2 semaines) - CRITIQUE
- Tests (backend + frontend)
- Secrets management
- Rate limiting
- Logging structuré

### Sprint 3-4 (2 semaines) - IMPORTANT
- Monitoring (Loki + Prometheus + Grafana)
- CI/CD pipeline
- Backups automatiques
- Validation environnement

### Sprint 5-6 (2 semaines) - OPTIMISATIONS
- Indexes base de données
- Export données
- Optimisations frontend
- Security headers

### Sprint 7-8 (2 semaines) - FEATURES
- Notifications email
- Recherche avancée
- Audit trail
- SSL/HTTPS

### Sprint 9+ - ÉVOLUTION
- PWA
- Analytics
- Elasticsearch
- Features avancées

---

## 📚 RESSOURCES

### Documentation Externe
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Query Patterns](https://tkdodo.eu/blog/practical-react-query)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [12-Factor App](https://12factor.net/)

### Outils Recommandés
- **Tests:** Jest, Vitest, Testing Library, Cypress
- **Logs:** Winston, Pino
- **Monitoring:** Grafana, Prometheus, Loki
- **Sécurité:** Helmet, express-rate-limit
- **Performance:** Lighthouse, WebPageTest

---

**Dernière mise à jour:** 2025-12-29
**Version analysée:** v0.4.1
**Analyse effectuée par:** Claude Sonnet 4.5
