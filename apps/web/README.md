# Frontend Web - Inventaire SI

Application React/TypeScript pour le système de gestion d'inventaire informatique de Groupe Tilly.

## Table des matières

- [Technologies](#technologies)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Configuration](#configuration)
- [Composants](#composants)
- [Authentification](#authentification)
- [Gestion de l'état](#gestion-de-létat)
- [Routing](#routing)
- [Formulaires et validation](#formulaires-et-validation)
- [Développement](#développement)

## Technologies

**Framework & Build:**
- React 18
- TypeScript
- Vite

**UI & Styling:**
- Tailwind CSS
- shadcn/ui (composants)
- Lucide React (icônes)

**State Management:**
- TanStack Query (React Query) - cache & fetching
- Zustand - state global (auth)

**Forms & Validation:**
- React Hook Form
- Zod

**Routing:**
- React Router v6

**Autres:**
- Axios (HTTP client)
- xlsx (import Excel)
- react-signature-canvas (signatures)
- date-fns (manipulation de dates)

## Structure du projet

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Layout principal
│   │   │   ├── Header.tsx         # Header avec logo Tilly
│   │   │   ├── Sidebar.tsx        # Navigation latérale
│   │   │   ├── MobileNav.tsx      # Menu mobile
│   │   │   └── ProtectedRoute.tsx # Guard d'authentification
│   │   ├── common/
│   │   │   ├── Pagination.tsx     # Pagination réutilisable
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RecentLoans.tsx
│   │   │   └── LowStockAlert.tsx
│   │   ├── employees/
│   │   │   ├── EmployeesTable.tsx
│   │   │   ├── EmployeeForm.tsx
│   │   │   └── ImportEmployeesDialog.tsx
│   │   ├── assets/
│   │   │   ├── AssetModelsTable.tsx
│   │   │   ├── AssetItemsTable.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── stock/
│   │   │   └── StockItemsTable.tsx
│   │   ├── loans/
│   │   │   ├── LoansTable.tsx
│   │   │   ├── LoanDetails.tsx
│   │   │   ├── LoanLineForm.tsx
│   │   │   └── SignatureCapture.tsx
│   │   └── users/
│   │       ├── UsersTable.tsx
│   │       └── UserForm.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EmployeesListPage.tsx
│   │   ├── AssetModelsListPage.tsx
│   │   ├── AssetItemsListPage.tsx
│   │   ├── StockItemsListPage.tsx
│   │   ├── LoansListPage.tsx
│   │   ├── LoanDetailsPage.tsx
│   │   └── UsersListPage.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          # Axios instance avec intercepteurs
│   │   │   ├── auth.api.ts
│   │   │   ├── users.api.ts
│   │   │   ├── employees.api.ts
│   │   │   ├── assetModels.api.ts
│   │   │   ├── assetItems.api.ts
│   │   │   ├── stockItems.api.ts
│   │   │   ├── loans.api.ts
│   │   │   └── dashboard.api.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── use-toast.ts
│   │   │   └── ...
│   │   ├── stores/
│   │   │   └── authStore.ts       # Zustand store pour auth
│   │   ├── schemas/
│   │   │   └── validation.schemas.ts  # Schémas Zod
│   │   ├── types/
│   │   │   ├── models.types.ts    # Types des modèles DB
│   │   │   ├── enums.ts           # Enums et labels
│   │   │   └── api.types.ts       # Types des réponses API
│   │   └── utils/
│   │       ├── cn.ts              # Utility Tailwind
│   │       ├── constants.ts
│   │       └── formatters.ts
│   ├── App.tsx                    # Router configuration
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Tailwind imports
├── public/
│   └── images/
│       ├── Tilly_Manutention_Logo_300x300.png
│       └── README.md
├── .env                           # Variables d'environnement
├── vite.config.ts                 # Configuration Vite
├── tailwind.config.js             # Configuration Tailwind
├── tsconfig.json                  # Configuration TypeScript
├── components.json                # Configuration shadcn/ui
├── Dockerfile
├── nginx.conf                     # Config Nginx pour production
└── README.md                      # Ce fichier
```

## Installation

### Développement local

```bash
cd apps/web

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec l'URL de l'API

# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur http://localhost:5173

### Docker

```bash
# Depuis la racine du projet
docker-compose up web
```

L'application sera accessible sur http://localhost:8080

## Configuration

### Variables d'environnement (.env)

```env
VITE_API_URL="http://localhost:3001/api"
```

**Note:** Les variables Vite doivent commencer par `VITE_` pour être accessibles dans le code.

### Accès aux variables

```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

## Composants

### Structure des composants

Le projet utilise **shadcn/ui** pour les composants de base (Button, Input, Dialog, etc.) qui sont dans `components/ui/`.

Les composants métier sont organisés par fonctionnalité dans des dossiers dédiés.

### shadcn/ui

Installer un nouveau composant:

```bash
npx shadcn@latest add [component-name]
```

Exemple:
```bash
npx shadcn@latest add select
npx shadcn@latest add tabs
```

### Composants réutilisables

#### Pagination

```tsx
import { Pagination } from '@/components/common/Pagination'

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  pageSize={pageSize}
  totalItems={totalItems}
  onPageChange={setCurrentPage}
  onPageSizeChange={setPageSize}
  pageSizeOptions={[10, 20, 50, 100]}
/>
```

#### StatusBadge

```tsx
import { StatusBadge } from '@/components/assets/StatusBadge'

<StatusBadge status="EN_STOCK" />
<StatusBadge status="PRETE" />
```

## Authentification

### Auth Store (Zustand)

```typescript
// apps/web/src/lib/stores/authStore.ts
interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User) => void
}
```

### Hook useAuth

```tsx
import { useAuth } from '@/lib/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <div>Bienvenue {user.username}</div>
}
```

### Protected Routes

```tsx
// App.tsx
<Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
  <Route path="/users" element={<UsersListPage />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={['ADMIN', 'GESTIONNAIRE']} />}>
  <Route path="/employees" element={<EmployeesListPage />} />
</Route>
```

### Gestion des tokens

- **Access Token:** Stocké en mémoire dans le Zustand store (jamais dans localStorage)
- **Refresh Token:** Cookie httpOnly géré par le backend
- **Auto-refresh:** Intercepteur Axios rafraîchit automatiquement l'access token expiré

```typescript
// apps/web/src/lib/api/client.ts
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Tenter de rafraîchir le token
      const newToken = await refreshAccessToken()
      // Retry la requête originale
    }
    return Promise.reject(error)
  }
)
```

## Gestion de l'état

### TanStack Query (React Query)

Utilisé pour le data fetching, cache, et synchronisation serveur.

**Pattern standard:**

```typescript
// Hook de lecture
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getAllEmployeesApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook de mutation
export const useCreateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employé créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création')
    }
  })
}
```

**Utilisation:**

```tsx
function EmployeesListPage() {
  const { data: employees, isLoading } = useEmployees()
  const createEmployee = useCreateEmployee()

  const handleCreate = (data) => {
    createEmployee.mutate(data)
  }

  if (isLoading) return <LoadingSpinner />

  return <EmployeesTable employees={employees} />
}
```

### Zustand

Utilisé uniquement pour l'état global d'authentification.

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (token, user) => set({
        accessToken: token,
        user,
        isAuthenticated: true
      }),
      logout: () => set({
        accessToken: null,
        user: null,
        isAuthenticated: false
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Ne persiste que l'user
    }
  )
)
```

## Routing

### Routes principales

```typescript
// App.tsx
<Routes>
  {/* Public */}
  <Route path="/login" element={<LoginPage />} />

  {/* Protected - Tous rôles */}
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="/dashboard" element={<DashboardPage />} />
  </Route>

  {/* ADMIN only */}
  <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
    <Route path="/users" element={<UsersListPage />} />
  </Route>

  {/* ADMIN + GESTIONNAIRE */}
  <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'GESTIONNAIRE']} />}>
    <Route path="/employees" element={<EmployeesListPage />} />
    <Route path="/assets/models" element={<AssetModelsListPage />} />
    <Route path="/assets/items" element={<AssetItemsListPage />} />
    <Route path="/stock" element={<StockItemsListPage />} />
    <Route path="/loans" element={<LoansListPage />} />
    <Route path="/loans/:id" element={<LoanDetailsPage />} />
  </Route>
</Routes>
```

### Navigation

```tsx
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()

  const handleClick = (loanId: string) => {
    navigate(`/loans/${loanId}`)
  }
}
```

## Formulaires et validation

### React Hook Form + Zod

**Pattern standard:**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Schéma de validation
const employeeSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  dept: z.string().optional(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

function EmployeeForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema)
  })

  const onSubmit = (data: EmployeeFormData) => {
    // Soumettre les données
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('firstName')} />
      {errors.firstName && <span>{errors.firstName.message}</span>}

      <Input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <Button type="submit">Créer</Button>
    </form>
  )
}
```

## Fonctionnalités clés

### Import Excel

Le composant `ImportEmployeesDialog` permet d'importer des employés depuis un fichier Excel:

```tsx
import { ImportEmployeesDialog } from '@/components/employees/ImportEmployeesDialog'

<ImportEmployeesDialog
  open={importDialogOpen}
  onClose={() => setImportDialogOpen(false)}
/>
```

**Format Excel attendu:**
- Société
- Agence
- Civilité
- Nom
- Prénom

Les emails sont générés automatiquement: `prenom.nom@groupetilly.com`

### Signatures numériques

```tsx
import SignatureCanvas from 'react-signature-canvas'

const signaturePad = useRef<SignatureCanvas>(null)

const handleSave = async () => {
  if (signaturePad.current) {
    const dataUrl = signaturePad.current.toDataURL()
    const blob = await fetch(dataUrl).then(r => r.blob())

    const formData = new FormData()
    formData.append('signature', blob, 'signature.png')

    await uploadSignature(loanId, formData)
  }
}

<SignatureCanvas
  ref={signaturePad}
  canvasProps={{
    width: 500,
    height: 200,
    className: 'signature-canvas'
  }}
/>
```

### Pagination client-side

Toutes les pages de liste utilisent la pagination côté client:

```tsx
const [currentPage, setCurrentPage] = useState(1)
const [pageSize, setPageSize] = useState(20)

// Réinitialiser à la page 1 quand le filtre change
useEffect(() => {
  setCurrentPage(1)
}, [searchTerm])

// Calculer la pagination
const totalItems = filteredData.length
const totalPages = Math.ceil(totalItems / pageSize)
const startIndex = (currentPage - 1) * pageSize
const endIndex = startIndex + pageSize
const paginatedData = filteredData.slice(startIndex, endIndex)
```

## Développement

### Commandes

```bash
# Démarrer le serveur de développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint

# Type checking
npm run type-check
```

### Hot Module Replacement (HMR)

Vite offre un HMR ultra-rapide pour le développement.

### Path Aliases

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

**Usage:**
```typescript
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/useAuth'
```

## Charte graphique Groupe Tilly

**Couleurs:**
```css
/* Noir */
--tilly-black: #231F20;

/* Orange */
--tilly-orange: #EE2722;

/* Blanc */
--tilly-white: #FFFFFF;
```

**Usage:**
```tsx
<div className="bg-[#231F20] text-[#EE2722]">
  Groupe Tilly
</div>
```

## Build & Déploiement

### Build de production

```bash
npm run build
```

Génère le dossier `dist/` avec les fichiers optimisés.

### Docker

Le Dockerfile utilise un build multi-stage avec Nginx:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

### Configuration Nginx

Le fichier `nginx.conf` gère le routing SPA:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Tests

```bash
# Tests unitaires (à implémenter)
npm test

# Tests E2E (à implémenter)
npm run test:e2e
```

**Frameworks recommandés:**
- **Unit:** Vitest + React Testing Library
- **E2E:** Playwright

## Accessibilité

- Navigation clavier complète
- ARIA labels sur les composants interactifs
- Contraste de couleurs conforme WCAG AA
- Focus visible sur tous les éléments interactifs

## Performance

- Code splitting par route avec React.lazy
- Query caching avec TanStack Query (staleTime: 5min)
- Images optimisées
- Build Vite optimisé

## Licence

Propriété de Groupe Tilly. Tous droits réservés.
