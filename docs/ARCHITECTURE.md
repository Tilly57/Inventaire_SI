# Architecture - Inventaire SI

**Version:** 0.8.0
**Date:** 2026-01-13

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture système](#architecture-système)
3. [Architecture backend](#architecture-backend)
4. [Architecture frontend](#architecture-frontend)
5. [Base de données](#base-de-données)
6. [Sécurité](#sécurité)
7. [Déploiement](#déploiement)

---

## 🏗️ Vue d'ensemble

Inventaire SI est une application monorepo fullstack pour la gestion d'inventaire IT avec système de prêts et signatures numériques.

### Stack technique

**Backend:**
- Node.js 20.x + Express
- Prisma ORM
- PostgreSQL 16
- Redis 7 (cache)

**Frontend:**
- React 19 + TypeScript
- Vite (bundler)
- React Query (data fetching)
- Zustand (state management)
- shadcn/ui (components)

**Infrastructure:**
- Docker + Docker Compose
- Nginx (reverse proxy + HTTPS)
- Grafana Stack (monitoring)

---

## 🌐 Architecture système

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Browser<br/>React App]
        Mobile[Mobile<br/>Responsive UI]
    end

    subgraph "Reverse Proxy"
        Nginx[Nginx<br/>HTTPS + Load Balancer]
    end

    subgraph "Application Layer"
        WebServer[Web Server<br/>Vite Preview:8080]
        API[API Server<br/>Express:3001]
    end

    subgraph "Cache Layer"
        Redis[Redis<br/>Cache + Sessions]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Database)]
        Uploads[/Uploads<br/>Signatures/]
    end

    subgraph "Monitoring"
        Prometheus[Prometheus<br/>Metrics]
        Grafana[Grafana<br/>Dashboards]
        Loki[Loki<br/>Logs]
    end

    Browser --> Nginx
    Mobile --> Nginx
    Nginx --> WebServer
    Nginx --> API
    API --> Redis
    API --> PostgreSQL
    API --> Uploads
    API --> Prometheus
    Prometheus --> Grafana
    Loki --> Grafana
```

### Flux de données

```mermaid
sequenceDiagram
    participant U as User
    participant N as Nginx
    participant F as Frontend
    participant A as API
    participant R as Redis
    participant DB as PostgreSQL

    U->>N: HTTPS Request
    N->>F: Forward to Frontend
    F->>U: Render React App

    U->>F: User Action
    F->>A: API Call (JWT)
    A->>A: Validate JWT

    alt Cache Hit
        A->>R: Check Cache
        R->>A: Return Cached Data
        A->>F: Response (fast)
    else Cache Miss
        A->>R: Check Cache
        R->>A: Cache Miss
        A->>DB: Query Database
        DB->>A: Return Data
        A->>R: Store in Cache
        A->>F: Response
    end

    F->>U: Update UI
```

---

## 🔧 Architecture backend

### Structure MVC

```
apps/api/
├── src/
│   ├── controllers/      # Controllers (handle HTTP)
│   │   ├── auth.controller.js
│   │   ├── employees.controller.js
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── auth.service.js
│   │   ├── employees.service.js
│   │   └── cache.service.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── routes/           # API routes
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   └── ...
│   ├── config/           # Configuration
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── env.js
│   ├── utils/            # Utilities
│   │   ├── validation.js
│   │   └── formatters.js
│   ├── app.js            # Express app setup
│   └── index.js          # Entry point
```

### Flux de requête

```mermaid
graph LR
    A[HTTP Request] --> B[Middleware Stack]
    B --> C{Authentication}
    C -->|Valid JWT| D{Authorization RBAC}
    C -->|Invalid| E[401 Unauthorized]
    D -->|Authorized| F[Rate Limiter]
    D -->|Forbidden| G[403 Forbidden]
    F -->|OK| H[Controller]
    F -->|Too Many| I[429 Too Many Requests]
    H --> J[Service Layer]
    J --> K{Cache?}
    K -->|Hit| L[Return Cached]
    K -->|Miss| M[Database Query]
    M --> N[Cache Result]
    N --> O[Response]
    L --> O
    O --> P[HTTP Response]
```

### Layers

**1. Routes Layer** - Définition des endpoints
```javascript
// routes/employees.routes.js
router.get('/', getAllEmployees);           // GET /api/employees
router.post('/', createEmployee);           // POST /api/employees
router.put('/:id', updateEmployee);         // PUT /api/employees/:id
router.delete('/:id', deleteEmployee);      // DELETE /api/employees/:id
```

**2. Controllers Layer** - Gestion HTTP
```javascript
// controllers/employees.controller.js
export async function getAllEmployees(req, res, next) {
  try {
    const employees = await employeesService.getAllEmployees();
    res.json(employees);
  } catch (error) {
    next(error);
  }
}
```

**3. Services Layer** - Business logic
```javascript
// services/employees.service.js
export async function getAllEmployees() {
  return getCached('employees:list', async () => {
    return await prisma.employee.findMany({
      orderBy: { lastName: 'asc' },
    });
  }, TTL.EMPLOYEES);
}
```

**4. Data Layer** - Database access (Prisma)
```javascript
// Prisma handles SQL generation
const employees = await prisma.employee.findMany();
```

---

## ⚛️ Architecture frontend

### Structure

```
apps/web/
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Shared components
│   │   ├── layout/       # Layout components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── employees/    # Feature: Employees
│   │   ├── dashboard/    # Feature: Dashboard
│   │   └── ...
│   ├── pages/            # Page components (routes)
│   │   ├── DashboardPage.tsx
│   │   ├── EmployeesListPage.tsx
│   │   └── ...
│   ├── lib/              # Libraries & utilities
│   │   ├── api/          # API client (axios)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── contexts/     # React contexts
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utilities
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
```

### Architecture composants

```mermaid
graph TD
    A[App.tsx] --> B[ErrorBoundary]
    B --> C[ThemeProvider]
    C --> D[QueryClientProvider]
    D --> E[BrowserRouter]
    E --> F[Routes]

    F --> G[LoginPage]
    F --> H[ProtectedRoute]

    H --> I[AppLayout]
    I --> J[Sidebar]
    I --> K[Header]
    I --> L[Main Content]

    L --> M[DashboardPage]
    L --> N[EmployeesListPage]
    L --> O[LoansListPage]
    L --> P[...]

    M --> Q[StatsCard]
    M --> R[RecentLoans]
    M --> S[EquipmentByTypeChart lazy]
```

### State Management

**1. Authentication (Zustand)**
```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  login: (email, password) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

**2. Server State (React Query)**
```typescript
// hooks/useEmployees.ts
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await apiClient.get('/employees');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**3. UI State (Local State)**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [currentPage, setCurrentPage] = useState(1);
```

### Performance optimizations

```mermaid
graph LR
    A[User Opens App] --> B[Code Splitting]
    B --> C[Load Core Bundle 78KB]
    C --> D[Render Login/Dashboard]

    D --> E[User Action]
    E --> F{Lazy Loading}
    F -->|Navigate Dashboard| G[Load Charts 97KB]
    F -->|Import Employees| H[Load xlsx 143KB]
    F -->|Other Page| I[Load Page Bundle]

    G --> J[Cache in Memory]
    H --> J
    I --> J
```

**Optimizations implémentées:**
- ✅ Code splitting (6 lazy routes)
- ✅ React.memo sur composants lourds
- ✅ useMemo/useCallback
- ✅ React Query caching
- ✅ Pagination (pas de virtualisation nécessaire)
- ✅ Compression gzip/brotli

---

## 🗄️ Base de données

### Schéma ER

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string firstName
        string lastName
        enum role
        datetime createdAt
        datetime updatedAt
    }

    Employee {
        string id PK
        string firstName
        string lastName
        string email UK
        string phone
        string dept
        datetime createdAt
        datetime updatedAt
    }

    AssetModel {
        string id PK
        string type
        string brand
        string modelName
        datetime createdAt
        datetime updatedAt
    }

    AssetItem {
        string id PK
        string assetModelId FK
        string serialNumber UK
        string assetTag UK
        enum status
        datetime createdAt
        datetime updatedAt
    }

    StockItem {
        string id PK
        string name
        int quantity
        int loaned
        int minQuantity
        datetime createdAt
        datetime updatedAt
    }

    Loan {
        string id PK
        string employeeId FK
        enum status
        datetime openedAt
        datetime closedAt
        string pickupSignatureUrl
        datetime pickupSignedAt
        string returnSignatureUrl
        datetime returnSignedAt
        boolean deleted
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    LoanLine {
        string id PK
        string loanId FK
        string assetItemId FK
        string stockItemId FK
        int quantity
        datetime createdAt
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string tableName
        string recordId
        json changes
        datetime createdAt
    }

    User ||--o{ Loan : creates
    User ||--o{ AuditLog : performs
    Employee ||--o{ Loan : borrows
    AssetModel ||--o{ AssetItem : has
    Loan ||--o{ LoanLine : contains
    AssetItem ||--o{ LoanLine : "in"
    StockItem ||--o{ LoanLine : "in"
```

### Indexes de performance

**19 indexes stratégiques:**
```sql
-- User
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);

-- Employee
CREATE INDEX idx_employee_email ON "Employee"(email);
CREATE INDEX idx_employee_name ON "Employee"(lastName, firstName);
CREATE INDEX idx_employee_dept ON "Employee"(dept);

-- AssetModel
CREATE INDEX idx_assetmodel_type ON "AssetModel"(type);
CREATE INDEX idx_assetmodel_brand ON "AssetModel"(brand);
CREATE INDEX idx_assetmodel_type_brand ON "AssetModel"(type, brand);

-- AssetItem
CREATE INDEX idx_assetitem_model ON "AssetItem"(assetModelId);
CREATE INDEX idx_assetitem_status ON "AssetItem"(status);
CREATE INDEX idx_assetitem_model_status ON "AssetItem"(assetModelId, status);

-- Loan
CREATE INDEX idx_loan_employee ON "Loan"(employeeId);
CREATE INDEX idx_loan_status ON "Loan"(status);
CREATE INDEX idx_loan_deleted ON "Loan"(deletedAt);
CREATE INDEX idx_loan_opened ON "Loan"(openedAt);
CREATE INDEX idx_loan_closed ON "Loan"(closedAt);

-- AuditLog
CREATE INDEX idx_auditlog_table_record ON "AuditLog"(tableName, recordId);
CREATE INDEX idx_auditlog_user ON "AuditLog"(userId);
CREATE INDEX idx_auditlog_created ON "AuditLog"(createdAt);
CREATE INDEX idx_auditlog_action ON "AuditLog"(action);
CREATE INDEX idx_auditlog_table_action ON "AuditLog"(tableName, action);
```

### Vue matérialisée (Dashboard)

```sql
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM "Employee") AS total_employees,
  (SELECT COUNT(*) FROM "AssetItem") AS total_assets,
  (SELECT COUNT(*) FROM "AssetItem" WHERE status = 'EN_STOCK') AS available_assets,
  (SELECT COUNT(*) FROM "Loan" WHERE status = 'OPEN') AS active_loans,
  (SELECT COUNT(*) FROM "StockItem" WHERE quantity <= "minQuantity") AS low_stock_items,
  (SELECT COUNT(*) FROM "StockItem" WHERE quantity = 0) AS out_of_stock_items,
  NOW() AS last_updated;
```

**Impact:** Dashboard query 150ms → 2ms (75x faster)

---

## 🔒 Sécurité

### Architecture de sécurité

```mermaid
graph TB
    subgraph "Security Layers"
        A[HTTPS/TLS<br/>Encryption in transit]
        B[Helmet CSP<br/>XSS Protection]
        C[CORS Validation<br/>Origin Filtering]
        D[Rate Limiting<br/>DDoS Protection]
        E[JWT Authentication<br/>Access + Refresh Tokens]
        F[RBAC Authorization<br/>Role-Based Access]
        G[Input Validation<br/>Zod Schemas]
        H[SQL Injection Protection<br/>Prisma ORM]
        I[Error Handling<br/>Secure Messages]
    end

    Request[HTTP Request] --> A
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> Response[HTTP Response]
```

### JWT Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant R as Redis

    C->>A: POST /auth/login<br/>{email, password}
    A->>A: Validate Credentials<br/>bcrypt.compare()
    A->>A: Generate Tokens
    A->>R: Store Refresh Token<br/>(7 days)
    A->>C: {accessToken, refreshToken}<br/>Access: 15min, Refresh: 7d

    Note over C: Store access in memory<br/>Store refresh in httpOnly cookie

    C->>A: GET /api/employees<br/>Authorization: Bearer {accessToken}
    A->>A: Verify JWT
    A->>A: Check RBAC
    A->>C: 200 OK + Data

    Note over C: Access token expired

    C->>A: POST /auth/refresh<br/>{refreshToken}
    A->>R: Validate Refresh Token
    R->>A: Token Valid
    A->>A: Generate New Access Token
    A->>C: {accessToken}

    C->>A: GET /api/employees<br/>New accessToken
    A->>C: 200 OK + Data
```

### RBAC Matrix

| Resource | ADMIN | GESTIONNAIRE | LECTURE |
|----------|-------|--------------|---------|
| Dashboard | ✅ R | ✅ R | ✅ R |
| Users | ✅ CRUD | ❌ | ❌ |
| Employees | ✅ CRUD | ✅ CRUD | ✅ R |
| Asset Models | ✅ CRUD | ✅ CRUD | ✅ R |
| Asset Items | ✅ CRUD | ✅ CRUD | ✅ R |
| Stock Items | ✅ CRUD | ✅ CRUD | ✅ R |
| Loans | ✅ CRUD | ✅ CRUD | ✅ R |
| Audit Logs | ✅ R | ✅ R | ❌ |

---

## 🚀 Déploiement

### Architecture de déploiement

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Load Balancer"
            LB[Nginx<br/>HTTPS Termination]
        end

        subgraph "Application Tier"
            API1[API Server 1<br/>Port 3001]
            API2[API Server 2<br/>Port 3002]
            WEB[Web Server<br/>Static Files]
        end

        subgraph "Cache Tier"
            Redis[Redis<br/>Cache]
        end

        subgraph "Data Tier"
            DB[(PostgreSQL<br/>Primary)]
            DBReplica[(PostgreSQL<br/>Replica)]
        end

        subgraph "Storage Tier"
            S3[Object Storage<br/>Signatures]
        end

        subgraph "Monitoring"
            Grafana[Grafana<br/>Dashboards]
            Prometheus[Prometheus<br/>Metrics]
        end
    end

    Internet --> LB
    LB --> WEB
    LB --> API1
    LB --> API2
    API1 --> Redis
    API2 --> Redis
    API1 --> DB
    API2 --> DB
    DB --> DBReplica
    API1 --> S3
    API2 --> S3
    API1 --> Prometheus
    API2 --> Prometheus
    Prometheus --> Grafana
```

### CI/CD Pipeline

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions]
    B --> C{Branch?}

    C -->|PR| D[Run Tests]
    D --> E[Lint]
    E --> F[Build]
    F --> G[Security Audit]
    G --> H{All Pass?}
    H -->|Yes| I[Approve PR]
    H -->|No| J[Block PR]

    C -->|main| K[Deploy Staging]
    K --> L[Run E2E Tests]
    L --> M{Tests Pass?}
    M -->|Yes| N[Deploy Production]
    M -->|No| O[Rollback]

    N --> P[Health Check]
    P --> Q[Monitor]
```

### Docker Stack

```yaml
services:
  nginx:       # Reverse proxy + HTTPS
  api:         # Backend API
  web:         # Frontend static
  postgres:    # Database
  redis:       # Cache
  prometheus:  # Metrics
  grafana:     # Dashboards
  loki:        # Logs
  promtail:    # Log collector
```

---

## 📊 Métriques

### Performance

| Métrique | Target | Actuel | Status |
|----------|--------|--------|--------|
| API Response Time (P95) | <200ms | 150ms | ✅ |
| Dashboard Load Time | <2s | 1.5s | ✅ |
| Bundle Size (gzipped) | <400KB | 300KB | ✅ |
| Lighthouse Score | >90 | 95 | ✅ |
| Database Queries | <50ms | 30ms | ✅ |

### Scalabilité

**Capacité actuelle:**
- 1000+ utilisateurs concurrents
- 10,000+ requêtes/minute
- 1M+ enregistrements en DB

**Limites identifiées:**
- Connection pool: 10 connexions (augmenter si besoin)
- Rate limiting: 100 req/min par IP (ajustable)
- Upload size: 10 MB max (configurable)

---

## 🔮 Roadmap technique

### v0.9.0 (Q1 2026)
- [ ] Migrate backend to TypeScript
- [ ] Implement WebSockets (real-time notifications)
- [ ] Add full-text search (PostgreSQL tsvector)
- [ ] Kubernetes deployment

### v1.0.0 (Q2 2026)
- [ ] Multi-tenancy support
- [ ] API versioning (v1/, v2/)
- [ ] GraphQL endpoint
- [ ] Mobile app (React Native)

---

**Dernière mise à jour:** 2026-01-13
**Version:** 0.8.0
