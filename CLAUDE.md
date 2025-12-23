# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inventaire SI is an IT asset and inventory management system with loan/borrowing tracking capabilities. The system manages IT equipment (AssetItems linked to AssetModels), consumable stock items, employees, and loan transactions with digital signature support.

## Architecture

### Monorepo Structure
- `apps/api/` - Node.js/Express REST API with Prisma ORM
- `apps/web/` - Frontend application (placeholder, not yet implemented)
- Docker Compose orchestration with PostgreSQL database

### Technology Stack
- **Backend**: Node.js (ESM), Express, Prisma ORM
- **Database**: PostgreSQL 16
- **Authentication**: JWT (access + refresh tokens), bcryptjs for password hashing
- **Validation**: Zod schemas
- **File Uploads**: Multer (for signature images)

## Database Schema

The system uses Prisma with the following core models:

- **User** - System users with roles (ADMIN, GESTIONNAIRE, LECTURE)
- **Employee** - End users who can borrow equipment
- **AssetModel** - Equipment templates (type, brand, modelName)
- **AssetItem** - Individual equipment instances with status tracking (EN_STOCK, PRETE, HS, REPARATION)
- **StockItem** - Consumable items with quantity
- **Loan** - Borrowing transactions with status (OPEN/CLOSED) and digital signatures
- **LoanLine** - Line items in loans (references either AssetItem or StockItem)

Key relationships:
- Loans track employee borrowing history
- LoanLines can reference either unique AssetItems or consumable StockItems
- Signatures are stored as file URLs (pickup and return signatures tracked separately)

## Development Commands

### Database Management
```bash
# Run Prisma migrations (deploy to production)
cd apps/api
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### API Development
```bash
# Development mode with hot reload
cd apps/api
npm run dev

# Production mode
npm run start
```

### Docker Operations
```bash
# Start all services (PostgreSQL + API + Web)
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild services
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Environment Configuration

### API Service (.env in apps/api/)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `CORS_ORIGIN` - Allowed CORS origin (frontend URL)
- `SIGNATURES_DIR` - Directory for storing signature images

**Note**: The docker-compose.yml contains default development credentials. These must be changed for production deployments.

## Key Design Patterns

### Asset vs Stock Items
The system distinguishes between:
- **AssetItems**: Unique, trackable equipment (laptops, monitors) with individual serial numbers and asset tags
- **StockItems**: Consumable items (cables, adapters) tracked by quantity

Both can be included in the same Loan via separate LoanLines.

### Loan Workflow
1. Loan created with status OPEN
2. Items added via LoanLines
3. Pickup signature captured (pickupSignatureUrl, pickupSignedAt)
4. When returned: return signature captured (returnSignatureUrl, returnSignedAt)
5. Loan status updated to CLOSED with closedAt timestamp

### Signature Storage
Signatures are stored as files in `/app/uploads/signatures` (mapped to Docker volume). The database stores URLs/paths to these files, not the image data itself.

## Important Notes

- The API uses ES modules (`"type": "module"` in package.json)
- Source code directory `apps/api/src/` exists but is currently empty - the application code needs to be implemented
- The web frontend (`apps/web/`) is a placeholder and has no files yet
- Prisma schema hardcodes database URL - this should be read from environment variables in production
- All IDs use CUID format via Prisma's `@default(cuid())`